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
        jobSeekerProfile: {
          select: {
            id: true,
            seekerType: true,
            companyName: true,
            isDualCapacity: true,
          },
        },
        employer: {
          select: {
            id: true,
            companyName: true,
            businessType: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const isAdmin = user.role === 'ADMIN';
    const tier = isAdmin ? 'PREMIUM' : user.subscriptionTier; // FREE, SILVER, PREMIUM
    const isDual = Boolean(
      user.jobSeekerProfile?.isDualCapacity ||
      user.jobSeekerProfile?.seekerType === 'COMPANY_CONTRACTOR' ||
      user.employer?.businessType?.toLowerCase().includes('contractor') ||
      user.employer?.businessType?.toLowerCase().includes('agency')
    );

    if (user.role === 'EMPLOYER') {
      const employerId = user.employer?.id;
      const jobCount = employerId
        ? await this.prisma.job.count({ where: { employerId } })
        : 0;

      let limit: number | null = 3;
      let tierName = 'Free Tier';
      let nextTier = 'Premium ($50/mo)';
      let isUnlimited = false;

      if (isAdmin) {
        limit = null;
        tierName = 'Admin Plan';
        isUnlimited = true;
      } else if (isDual) {
        // Dual-Capacity Contractor in Employer (hiring crew) mode
        if (tier === 'FREE') {
          limit = 1;
          tierName = 'Free Contractor';
          nextTier = 'Pro Contractor ($70/mo)';
        } else if (tier === 'SILVER') {
          limit = 15;
          tierName = 'Pro Contractor Plan';
          nextTier = 'Enterprise Firm ($130/mo)';
        } else if (tier === 'PREMIUM') {
          limit = null;
          tierName = 'Enterprise Firm Plan';
          isUnlimited = true;
        }
      } else {
        // Standard Direct Employer
        if (tier === 'FREE') {
          limit = 3;
          tierName = 'Free Tier';
          nextTier = 'Premium ($50/mo)';
        } else if (tier === 'SILVER') {
          limit = 70;
          tierName = 'Premium Plan';
          nextTier = 'Enterprise ($100/mo)';
        } else if (tier === 'PREMIUM') {
          limit = null;
          tierName = 'Enterprise Plan';
          isUnlimited = true;
        }
      }

      const remaining = isUnlimited ? null : Math.max(0, (limit || 0) - jobCount);
      const isExhausted = !isUnlimited && remaining !== null && remaining <= 0;
      const isLow = !isUnlimited && remaining !== null && (
        (limit === 1 && remaining <= 0) ||
        (limit === 3 && remaining <= 1) ||
        (limit === 15 && remaining <= 3) ||
        (limit === 70 && remaining <= 10)
      );

      return {
        role: 'EMPLOYER',
        tier,
        tierName,
        isDualCapacity: isDual,
        used: jobCount,
        limit,
        remaining,
        isUnlimited,
        isLow,
        isExhausted,
        metricName: isDual ? 'Crew Job Postings' : 'Job Postings',
        warningMessage: isExhausted
          ? `You have reached your limit of ${limit} job postings on ${tierName}. Upgrade to ${nextTier} to post more jobs!`
          : isLow
          ? `Notice: Only ${remaining} of ${limit} job postings remaining on ${tierName}. Upgrade to ${nextTier} soon.`
          : null,
        nextTier,
      };
    } else {
      // Job Seeker or Commercial Contractor bidding mode
      const seekerId = user.jobSeekerProfile?.id;
      const appCount = seekerId
        ? await this.prisma.application.count({ where: { jobSeekerId: seekerId } })
        : 0;
      const aiUsed = user.freeGenerationsUsed || 0;

      let limit: number | null = 3;
      let tierName = 'Free Tier';
      let nextTier = 'Silver ($13/mo)';
      let isUnlimited = false;
      let metricName = 'AI Applications & Resumes';

      if (isAdmin) {
        limit = null;
        tierName = 'Admin Plan';
        isUnlimited = true;
      } else if (isDual) {
        metricName = 'Commercial Contract Bids';
        if (tier === 'FREE') {
          limit = 1;
          tierName = 'Free Contractor';
          nextTier = 'Pro Contractor ($70/mo)';
        } else if (tier === 'SILVER') {
          limit = 30;
          tierName = 'Pro Contractor Plan';
          nextTier = 'Enterprise Firm ($130/mo)';
        } else if (tier === 'PREMIUM') {
          limit = null;
          tierName = 'Enterprise Firm Plan';
          isUnlimited = true;
        }
      } else {
        if (tier === 'FREE') {
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
      }

      const used = Math.max(aiUsed, appCount);
      const remaining = isUnlimited ? null : Math.max(0, (limit || 0) - used);
      const isExhausted = !isUnlimited && remaining !== null && remaining <= 0;
      const isLow = !isUnlimited && remaining !== null && (
        (limit === 1 && remaining <= 0) ||
        (limit === 3 && remaining <= 1) ||
        (limit === 15 && remaining <= 3) ||
        (limit === 30 && remaining <= 5)
      );

      return {
        role: 'JOB_SEEKER',
        tier,
        tierName,
        isDualCapacity: isDual,
        used,
        limit,
        remaining,
        isUnlimited,
        isLow,
        isExhausted,
        metricName,
        warningMessage: isExhausted
          ? `You have reached your limit of ${limit} ${metricName.toLowerCase()} on ${tierName}. Upgrade to ${nextTier} to continue!`
          : isLow
          ? `Notice: Only ${remaining} of ${limit} ${metricName.toLowerCase()} remaining on ${tierName}. Upgrade to ${nextTier} soon.`
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

