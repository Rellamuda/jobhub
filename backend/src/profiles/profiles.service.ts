import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async upsertJobSeekerProfile(userId: string, data: any) {
    const existing = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.jobSeekerProfile.update({
        where: { userId },
        data,
      });
    }
    return this.prisma.jobSeekerProfile.create({
      data: {
        firstName: data.firstName || 'Job',
        lastName: data.lastName || 'Seeker',
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async updateAutoApply(userId: string, enabled: boolean, keywords?: string[]) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }
    return this.prisma.jobSeekerProfile.update({
      where: { userId },
      data: {
        autoApplyEnabled: enabled,
        ...(keywords !== undefined ? { autoApplyKeywords: keywords } : {}),
      },
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
    return this.prisma.employer.upsert({
      where: { userId },
      update: data,
      create: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async getEmployerProfile(userId: string) {
    const profile = await this.prisma.employer.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      throw new NotFoundException('Employer profile not found.');
    }
    
    return profile;
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
