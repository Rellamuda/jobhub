import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}

  async getStats() {
    try {
      const [
        totalUsers,
        jobSeekers,
        employers,
        admins,
        freeUsers,
        silverUsers,
        premiumUsers,
        activeUsers,
        suspendedUsers,
        flaggedUsers,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: 'JOB_SEEKER' } }),
        this.prisma.user.count({ where: { role: 'EMPLOYER' } }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.user.count({ where: { subscriptionTier: 'FREE' } }),
        this.prisma.user.count({ where: { subscriptionTier: 'SILVER' } }),
        this.prisma.user.count({ where: { subscriptionTier: 'PREMIUM' } }),
        this.prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
        this.prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
        this.prisma.user.count({ where: { isFlagged: true } }),
      ]);

      return {
        totalUsers,
        jobSeekers,
        employers,
        admins,
        freeUsers,
        silverUsers,
        premiumUsers,
        paidUsers: silverUsers + premiumUsers,
        activeUsers,
        suspendedUsers,
        flaggedUsers,
      };
    } catch (e: any) {
      throw new InternalServerErrorException(e.message || 'Failed to fetch admin stats');
    }
  }

  async getAllUsers() {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          subscriptionTier: true,
          freeGenerationsUsed: true,
          fraudScore: true,
          isFlagged: true,
          flagReason: true,
          accountStatus: true,
          createdAt: true,
          updatedAt: true,
          jobSeekerProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              otherNames: true,
              gender: true,
              profession: true,
              phone: true,
              residenceCountry: true,
              residenceState: true,
              residenceCity: true,
              citizenshipCountry: true,
              dateOfBirth: true,
              skills: true,
              desiredJobTitle: true,
              bio: true,
              headline: true,
              willingToRelocate: true,
              autoApplyEnabled: true,
              experience: true,
              education: true,
            },
          },
          employer: {
            select: {
              id: true,
              companyName: true,
              description: true,
              industry: true,
              companySize: true,
              website: true,
              locationCountry: true,
              locationState: true,
              locationCity: true,
              hrContactName: true,
              hrEmail: true,
              hrPhone: true,
              registrationNumber: true,
              taxId: true,
              jobs: {
                select: {
                  id: true,
                  title: true,
                  location: true,
                  isRemote: true,
                  createdAt: true,
                },
              },
            },
          },
          _count: {
            select: {
              payments: true,
              notifications: true,
              sentMessages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (e: any) {
      throw new InternalServerErrorException(e.message || 'Failed to fetch users');
    }
  }

  async updateUserStatus(id: string, status: string) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { accountStatus: status },
      });
    } catch (e: any) {
      throw new InternalServerErrorException(e.message || 'Failed to update status');
    }
  }

  async updateUser(id: string, data: {
    role?: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
    subscriptionTier?: 'FREE' | 'SILVER' | 'PREMIUM';
    accountStatus?: string;
    isFlagged?: boolean;
    flagReason?: string;
  }) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (e: any) {
      throw new InternalServerErrorException(e.message || 'Failed to update user');
    }
  }

  async deleteUser(id: string) {
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return await this.prisma.$transaction(async (tx) => {
        // 1. Delete notifications
        await tx.notification.deleteMany({ where: { userId: id } });

        // 2. Delete direct messages sent or received
        await tx.message.deleteMany({
          where: { OR: [{ senderId: id }, { receiverId: id }] },
        });

        // 3. Delete payments
        await tx.payment.deleteMany({ where: { userId: id } });

        // 4. Delete candidate notes authored by this user
        await tx.candidateNote.deleteMany({ where: { authorId: id } });

        // 5. Delete likes by user
        await tx.like.deleteMany({ where: { userId: id } });

        // 6. Delete comments by user
        await tx.comment.deleteMany({ where: { authorId: id } });

        // 7. Delete posts authored by user (and any associated likes/comments on them)
        const userPosts = await tx.post.findMany({ where: { authorId: id }, select: { id: true } });
        if (userPosts.length > 0) {
          const postIds = userPosts.map((p) => p.id);
          await tx.like.deleteMany({ where: { postId: { in: postIds } } });
          await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
          await tx.post.deleteMany({ where: { id: { in: postIds } } });
        }

        // 8. Delete connections & followed companies
        await tx.connection.deleteMany({
          where: { OR: [{ userId: id }, { connectedUserId: id }] },
        });
        await tx.companyFollower.deleteMany({ where: { userId: id } });

        // 9. Delete referrals where user is the referrer
        await tx.referral.deleteMany({ where: { referrerId: id } });

        // 10. Check and clean up Employer profile & associated data
        const employer = await tx.employer.findUnique({ where: { userId: id } });
        if (employer) {
          // Clean up talent pools
          await tx.talentPool.deleteMany({ where: { employerId: employer.id } });

          // Clean up jobs and their applications + referrals
          const employerJobs = await tx.job.findMany({ where: { employerId: employer.id }, select: { id: true } });
          if (employerJobs.length > 0) {
            const jobIds = employerJobs.map((j) => j.id);
            await tx.referral.deleteMany({ where: { jobId: { in: jobIds } } });
            await tx.application.deleteMany({ where: { jobId: { in: jobIds } } });
            await tx.job.deleteMany({ where: { id: { in: jobIds } } });
          }

          // Clean up company followers for this employer
          await tx.companyFollower.deleteMany({ where: { employerId: employer.id } });

          await tx.employer.delete({ where: { id: employer.id } });
        }

        // 11. Check and clean up JobSeekerProfile & associated data
        const seeker = await tx.jobSeekerProfile.findUnique({ where: { userId: id } });
        if (seeker) {
          // Clean up candidate notes written about this candidate
          await tx.candidateNote.deleteMany({ where: { jobSeekerProfileId: seeker.id } });

          // Clean up candidate tags
          await tx.candidateTag.deleteMany({ where: { jobSeekerProfileId: seeker.id } });

          // Clean up credentials
          await tx.credential.deleteMany({ where: { jobSeekerProfileId: seeker.id } });

          // Clean up referrals where seeker is the referred candidate
          await tx.referral.deleteMany({ where: { candidateId: seeker.id } });

          // Clean up applications submitted by this seeker
          await tx.application.deleteMany({ where: { jobSeekerId: seeker.id } });

          // Clean up resumes created by this seeker (and any remaining application links)
          const seekerResumes = await tx.resume.findMany({ where: { jobSeekerId: seeker.id }, select: { id: true } });
          if (seekerResumes.length > 0) {
            const resumeIds = seekerResumes.map((r) => r.id);
            await tx.application.deleteMany({ where: { resumeId: { in: resumeIds } } });
            await tx.resume.deleteMany({ where: { id: { in: resumeIds } } });
          }

          await tx.jobSeekerProfile.delete({ where: { id: seeker.id } });
        }

        // 12. Finally, delete User record
        await tx.user.delete({ where: { id } });

        this.logger.log(`User ${id} and all related dependencies successfully deleted.`);
        return { success: true, message: 'User and all associated data permanently deleted' };
      });
    } catch (e: any) {
      this.logger.error(`Failed to delete user ${id}: ${e.message}`, e.stack);
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerErrorException(e.message || 'Failed to delete user due to dependencies');
    }
  }
}
