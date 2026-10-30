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

  async getUserUsageAndQuota(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        subscriptionTier: true,
        freeGenerationsUsed: true,
        jobSeekerProfile: { select: { id: true } },
        employer: { select: { id: true } },
      },
    });

    if (!user) {
      return null;
    }

    const isAdmin = user.role === 'ADMIN';
    const tier = isAdmin ? 'PREMIUM' : user.subscriptionTier; // FREE, SILVER, PREMIUM

    if (user.role === 'EMPLOYER') {
      const employerId = user.employer?.id;
      const jobCount = employerId
        ? await this.prisma.job.count({ where: { employerId } })
        : 0;

      // Employer Tier Limits (Option A):
      // FREE: 3 jobs
      // SILVER / PREMIUM ($50): 70 jobs
      // ENTERPRISE ($100): Unlimited
      let limit: number | null = 3;
      let tierName = 'Free Tier';
      let nextTier = 'Premium ($50/mo)';
      let isUnlimited = false;

      if (isAdmin) {
        limit = null;
        tierName = 'Admin Plan';
        isUnlimited = true;
      } else if (tier === 'FREE') {
        limit = 3;
        tierName = 'Free Tier';
        nextTier = 'Premium ($50/mo)';
      } else if (tier === 'SILVER') {
        // Option A $50 plan
        limit = 70;
        tierName = 'Premium Plan';
        nextTier = 'Enterprise ($100/mo)';
      } else if (tier === 'PREMIUM') {
        // Option A $100 plan (Enterprise)
        limit = null;
        tierName = 'Enterprise Plan';
        isUnlimited = true;
      }

      const remaining = isUnlimited ? null : Math.max(0, (limit || 0) - jobCount);
      const isExhausted = !isUnlimited && remaining !== null && remaining <= 0;
      // Pre-exhaustion warning when at 80%+ usage or <= 1 left for Free, <= 5 left for 70 limit
      const isLow = !isUnlimited && remaining !== null && (
        (limit === 3 && remaining <= 1) ||
        (limit === 70 && remaining <= 10)
      );

      return {
        role: 'EMPLOYER',
        tier,
        tierName,
        used: jobCount,
        limit,
        remaining,
        isUnlimited,
        isLow,
        isExhausted,
        metricName: 'Job Postings',
        warningMessage: isExhausted
          ? `You have reached your limit of ${limit} job postings on ${tierName}. Upgrade to ${nextTier} to post more jobs!`
          : isLow
          ? `Notice: Only ${remaining} of ${limit} job postings remaining on ${tierName}. Upgrade to ${nextTier} soon.`
          : null,
        nextTier,
      };
    } else {
      // Job Seeker
      const seekerId = user.jobSeekerProfile?.id;
      const appCount = seekerId
        ? await this.prisma.application.count({ where: { jobSeekerId: seekerId } })
        : 0;
      const aiUsed = user.freeGenerationsUsed || 0;

      // Job Seeker Tier Limits:
      // FREE: 3 AI generations, 3 job applications
      // SILVER ($13/mo): 15 AI generations, 15 applications
      // DIAMOND ($20/mo): Unlimited
      let limit: number | null = 3;
      let tierName = 'Free Tier';
      let nextTier = 'Silver ($13/mo)';
      let isUnlimited = false;

      if (isAdmin) {
        limit = null;
        tierName = 'Admin Plan';
        isUnlimited = true;
      } else if (tier === 'FREE') {
        limit = 3;
        tierName = 'Free Tier';
        nextTier = 'Silver ($13/mo)';
      } else if (tier === 'SILVER') {
        limit = 15;
        tierName = 'Silver Plan';
        nextTier = 'Diamond ($20/mo)';
      } else if (tier === 'PREMIUM') {
        limit = null;
        tierName = 'Diamond Plan';
        isUnlimited = true;
      }

      const used = Math.max(aiUsed, appCount);
      const remaining = isUnlimited ? null : Math.max(0, (limit || 0) - used);
      const isExhausted = !isUnlimited && remaining !== null && remaining <= 0;
      const isLow = !isUnlimited && remaining !== null && remaining <= (limit === 3 ? 1 : 3);

      return {
        role: 'JOB_SEEKER',
        tier,
        tierName,
        used,
        limit,
        remaining,
        isUnlimited,
        isLow,
        isExhausted,
        metricName: 'AI Applications & Resumes',
        warningMessage: isExhausted
          ? `You have used all ${limit} ${tierName} AI application credits. Upgrade to ${nextTier} to continue applying!`
          : isLow
          ? `Notice: Only ${remaining} of ${limit} AI application credits remaining on ${tierName}. Upgrade to ${nextTier} soon.`
          : null,
        nextTier,
      };
    }
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

