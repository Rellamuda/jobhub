import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async upsertJobSeekerProfile(userId: string, data: any) {
    const existing = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    let profileResult;
    if (existing) {
      profileResult = await this.prisma.jobSeekerProfile.update({
        where: { userId },
        data,
      });
    } else {
      profileResult = await this.prisma.jobSeekerProfile.create({
        data: {
          firstName: data.firstName || 'Job',
          lastName: data.lastName || 'Seeker',
          ...data,
          user: { connect: { id: userId } },
        },
        include: { user: true },
      });

      if (profileResult.user?.email) {
        this.mailService
          .sendOnboardingWelcomeEmail({
            to: profileResult.user.email,
            name: `${profileResult.firstName || ''} ${profileResult.lastName || ''}`.trim() || 'Job Seeker',
            role: 'JOB_SEEKER',
          })
          .catch((err) => console.warn('Could not dispatch onboarding email:', err));
      }
    }

    // If company contractor or dual-capacity, immediately sync/upsert Employer record
    if (data.seekerType === 'COMPANY_CONTRACTOR' || data.isDualCapacity || data.companyName) {
      const companyName = data.companyName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Enterprise Partner';
      const employerData = {
        companyName,
        businessType: 'Corporate Contractor / Agency',
        registrationNumber: data.businessRegNumber || null,
        locationCountry: data.residenceCountry || null,
        locationState: data.residenceState || null,
        locationCity: data.residenceCity || null,
        profilePicture: data.profilePicture || null,
        description: data.summary || data.bio || data.headline || `${companyName} - Verified commercial contractor and employer on JobHub Global.`,
        industry: data.preferredIndustry || 'Commercial Contracting & Services',
        hrContactName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Principal Representative',
        hrPhone: data.phone || null,
        companySize: data.crewSize ? `${data.crewSize} Staff / Crew` : '1-10',
        verificationStatus: data.verificationStatus || 'UNVERIFIED',
      };
      await this.prisma.employer.upsert({
        where: { userId },
        create: {
          ...employerData,
          user: { connect: { id: userId } },
        },
        update: employerData,
      }).catch(err => console.warn('Could not auto-sync employer record:', err));
    }

    return profileResult;
  }

  async updateAutoApply(userId: string, enabled: boolean, keywords?: string[], autonomousMode?: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }
    const updateData: any = {
      autoApplyEnabled: enabled,
      ...(keywords !== undefined ? { autoApplyKeywords: keywords } : {}),
    };
    if (autonomousMode) {
      updateData.autonomousMode = autonomousMode.toUpperCase() === 'FULL' ? 'FULL' : 'PARTIAL';
    }
    return this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  async searchTalent(skill?: string) {
    const whereClause: any = { isFlagged: false };
    if (skill) {
      whereClause.skills = { has: skill };
    }
    
    return this.prisma.jobSeekerProfile.findMany({
      where: whereClause,
      include: {
        user: { select: { email: true } }
      },
      take: 50,
      orderBy: { profileViews: 'desc' }
    });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markNotificationRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
    return { success: true, id, isRead: true };
  }

  async deleteNotification(userId: string, id: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId }
    });
  }

  async getReferralLeaderboard() {
    // Group by referrer and sum rewards
    const result = await this.prisma.referral.groupBy({
      by: ['referrerId'],
      _sum: { rewardAmount: true },
      _count: { id: true },
      orderBy: { _sum: { rewardAmount: 'desc' } },
      take: 10
    });

    // Attach user emails for display
    const leaderboard: { email: string, totalRewards: number | null, totalReferrals: number }[] = [];
    for (const row of result) {
      const user = await this.prisma.user.findUnique({ where: { id: row.referrerId } });
      if (user) {
        leaderboard.push({
          email: user.email,
          totalRewards: row._sum.rewardAmount,
          totalReferrals: row._count.id
        });
      }
    }
    return leaderboard;
  }

  async getJobSeekerProfile(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      throw new NotFoundException('Job seeker profile not found.');
    }
    
    return profile;
  }

  async upsertEmployerProfile(userId: string, data: Prisma.EmployerUpdateInput & Prisma.EmployerCreateWithoutUserInput) {
    const existing = await this.prisma.employer.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.employer.update({
        where: { userId },
        data,
      });
    }
    const created = await this.prisma.employer.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
      include: { user: true },
    });

    if (created.user?.email) {
      this.mailService
        .sendOnboardingWelcomeEmail({
          to: created.user.email,
          name: created.companyName || 'Hiring Partner',
          role: 'EMPLOYER',
        })
        .catch((err) => console.warn('Could not dispatch onboarding email:', err));
    }

    return created;
  }

  async getEmployerProfile(userId: string) {
    let profile = await this.prisma.employer.findUnique({
      where: { userId },
      include: {
        jobs: {
          select: { id: true, title: true, location: true, employmentType: true }
        }
      }
    });

    const seeker = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    
    if (!profile) {
      if (seeker) {
        const companyName = seeker.companyName || `${seeker.firstName || ''} ${seeker.lastName || ''}`.trim() || 'Company';
        profile = await this.prisma.employer.create({
          data: {
            user: { connect: { id: userId } },
            companyName,
            businessType: seeker.seekerType === 'COMPANY_CONTRACTOR' ? 'Corporate Contractor / Agency' : 'Direct Employer',
            registrationNumber: seeker.businessRegNumber || null,
            locationCountry: seeker.residenceCountry || null,
            locationState: seeker.residenceState || null,
            locationCity: seeker.residenceCity || null,
            profilePicture: seeker.profilePicture || null,
            description: seeker.summary || seeker.bio || seeker.headline || `${companyName} - Verified Contracting & Hiring Partner.`,
            industry: seeker.preferredIndustry || 'Commercial Contracting & Services',
            hrContactName: `${seeker.firstName || ''} ${seeker.lastName || ''}`.trim() || 'Principal Representative',
            hrEmail: (await this.prisma.user.findUnique({ where: { id: userId } }))?.email || null,
            hrPhone: seeker.phone || null,
            companySize: seeker.crewSize ? `${seeker.crewSize} Staff / Crew` : '1-10',
            verificationStatus: seeker.verificationStatus || 'UNVERIFIED',
          },
          include: {
            jobs: {
              select: { id: true, title: true, location: true, employmentType: true }
            }
          }
        });
      } else {
        throw new NotFoundException('Employer profile not found.');
      }
    }

    return {
      ...profile,
      companyName: profile.companyName || seeker?.companyName || 'Corporate Partner',
      description: profile.description || seeker?.summary || seeker?.bio || seeker?.headline || 'Verified Corporate Partner on JobHub Global.',
      industry: profile.industry || seeker?.preferredIndustry || 'Commercial Contracting & Services',
      locationCountry: profile.locationCountry || seeker?.residenceCountry || null,
      locationState: profile.locationState || seeker?.residenceState || null,
      locationCity: profile.locationCity || seeker?.residenceCity || null,
      profilePicture: profile.profilePicture || seeker?.profilePicture || null,
      hrContactName: profile.hrContactName || `${seeker?.firstName || ''} ${seeker?.lastName || ''}`.trim() || 'Principal Representative',
      hrPhone: profile.hrPhone || seeker?.phone || null,
      companySize: profile.companySize || (seeker?.crewSize ? `${seeker.crewSize} Staff / Crew` : '1-10'),
      registrationNumber: profile.registrationNumber || seeker?.businessRegNumber || null,
      seekerType: seeker?.seekerType || (profile.businessType?.includes('Contractor') ? 'COMPANY_CONTRACTOR' : 'INDIVIDUAL'),
      isDualCapacity: seeker?.isDualCapacity || seeker?.seekerType === 'COMPANY_CONTRACTOR',
      crewSize: seeker?.crewSize || 1,
      representativeName: `${seeker?.firstName || ''} ${seeker?.lastName || ''}`.trim(),
      contractorSkills: seeker?.skills || [],
      contractorExperience: seeker?.experience || [],
      contractorProjects: seeker?.projects || [],
      contractorHeadline: seeker?.headline || '',
    };
  }

  async getPublicEmployerProfile(employerId: string) {
    const profile = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        jobs: {
          where: { deadline: { gte: new Date() } } // only active jobs
        }
      }
    });

    if (!profile) {
      throw new NotFoundException('Company not found.');
    }

    // Increment views asynchronously
    this.prisma.employer.update({
      where: { id: employerId },
      data: { profileViews: { increment: 1 } }
    }).catch(() => {});

    return profile;
  }

  async getJobSeekerCompletionPercentage(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) return { completion: 0 };

    // Core fields check
    const fieldsToCheck = [
      'firstName', 'lastName', 'profession', 'residenceCountry', 
      'phone', 'headline', 'summary', 'desiredJobTitle', 
      'profilePicture'
    ];
    
    let filled = 0;
    for (const field of fieldsToCheck) {
      if (profile[field]) filled++;
    }

    // Array fields check
    const arrayFields = ['education', 'experience', 'skills'];
    for (const field of arrayFields) {
      const arr = profile[field] as any[];
      if (arr && arr.length > 0) filled++;
    }

    const totalFields = fieldsToCheck.length + arrayFields.length;
    const percentage = Math.round((filled / totalFields) * 100);

    return { completion: percentage };
  }

  async incrementSeekerProfileView(profileId: string) {
    return this.prisma.jobSeekerProfile.update({
      where: { id: profileId },
      data: { profileViews: { increment: 1 } }
    });
  }
}
