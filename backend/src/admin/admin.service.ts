import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
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
      return await this.prisma.$transaction(async (tx) => {
        // 1. Delete notifications
        await tx.notification.deleteMany({ where: { userId: id } }).catch(() => {});
        // 2. Delete messages
        await tx.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }).catch(() => {});
        // 3. Delete payments
        await tx.payment.deleteMany({ where: { userId: id } }).catch(() => {});
        // 4. Delete candidate notes
        await tx.candidateNote.deleteMany({ where: { authorId: id } }).catch(() => {});
        // 5. Delete connections, posts, comments, likes
        await tx.like.deleteMany({ where: { userId: id } }).catch(() => {});
        await tx.comment.deleteMany({ where: { authorId: id } }).catch(() => {});
        await tx.post.deleteMany({ where: { authorId: id } }).catch(() => {});
        await tx.connection.deleteMany({ where: { OR: [{ userId: id }, { connectedUserId: id }] } }).catch(() => {});
        await tx.companyFollower.deleteMany({ where: { userId: id } }).catch(() => {});

        // 6. Check and delete employer
        const employer = await tx.employer.findUnique({ where: { userId: id } });
        if (employer) {
          const jobs = await tx.job.findMany({ where: { employerId: employer.id } });
          for (const job of jobs) {
            await tx.application.deleteMany({ where: { jobId: job.id } }).catch(() => {});
            await tx.job.delete({ where: { id: job.id } }).catch(() => {});
          }
          await tx.employer.delete({ where: { id: employer.id } }).catch(() => {});
        }

        // 7. Check and delete jobSeekerProfile
        const seeker = await tx.jobSeekerProfile.findUnique({ where: { userId: id } });
        if (seeker) {
          await tx.application.deleteMany({ where: { jobSeekerId: seeker.id } }).catch(() => {});
          await tx.credential.deleteMany({ where: { jobSeekerProfileId: seeker.id } }).catch(() => {});
          await tx.candidateTag.deleteMany({ where: { jobSeekerProfileId: seeker.id } }).catch(() => {});
          await tx.jobSeekerProfile.delete({ where: { id: seeker.id } }).catch(() => {});
        }

        // 8. Delete user
        await tx.user.delete({
          where: { id },
        });

        return { success: true, message: 'User and all associated data permanently deleted' };
      });
    } catch (e: any) {
      throw new InternalServerErrorException(e.message || 'Failed to delete user due to dependencies');
    }
  }
}
