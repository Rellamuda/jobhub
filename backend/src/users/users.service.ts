import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email.trim().toLowerCase(),
      },
    });
  }

  async deleteAccount(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete JobSeeker data if exists
      const jobSeekerProfile = await tx.jobSeekerProfile.findUnique({ where: { userId } });
      if (jobSeekerProfile) {
        await tx.application.deleteMany({ where: { jobSeekerId: jobSeekerProfile.id } });
        await tx.resume.deleteMany({ where: { jobSeekerId: jobSeekerProfile.id } });
        await tx.credential.deleteMany({ where: { jobSeekerProfileId: jobSeekerProfile.id } });
        await tx.candidateNote.deleteMany({ where: { jobSeekerProfileId: jobSeekerProfile.id } });
        await tx.candidateTag.deleteMany({ where: { jobSeekerProfileId: jobSeekerProfile.id } });
        await tx.referral.deleteMany({ where: { candidateId: jobSeekerProfile.id } });
        await tx.jobSeekerProfile.delete({ where: { id: jobSeekerProfile.id } });
      }

      // 2. Delete Employer data if exists
      const employer = await tx.employer.findUnique({ where: { userId } });
      if (employer) {
        const jobs = await tx.job.findMany({ where: { employerId: employer.id }, select: { id: true } });
        const jobIds = jobs.map((j) => j.id);
        if (jobIds.length > 0) {
          await tx.application.deleteMany({ where: { jobId: { in: jobIds } } });
          await tx.referral.deleteMany({ where: { jobId: { in: jobIds } } });
          await tx.job.deleteMany({ where: { employerId: employer.id } });
        }
        await tx.talentPool.deleteMany({ where: { employerId: employer.id } });
        await tx.companyFollower.deleteMany({ where: { employerId: employer.id } });
        await tx.employer.delete({ where: { id: employer.id } });
      }

      // 3. Delete user messages, interactions, and notifications
      await tx.message.deleteMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.candidateNote.deleteMany({ where: { authorId: userId } });
      await tx.comment.deleteMany({ where: { authorId: userId } });
      await tx.like.deleteMany({ where: { userId } });
      await tx.post.deleteMany({ where: { authorId: userId } });
      await tx.connection.deleteMany({
        where: {
          OR: [{ userId }, { connectedUserId: userId }],
        },
      });
      await tx.companyFollower.deleteMany({ where: { userId } });
      await tx.referral.deleteMany({ where: { referrerId: userId } });
      await tx.payment.deleteMany({ where: { userId } });

      // 4. Finally delete the User record
      return tx.user.delete({ where: { id: userId } });
    });
  }
}

