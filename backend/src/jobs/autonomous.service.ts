import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutonomousService {
  private readonly logger = new Logger(AutonomousService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running autonomous job matching and permission requests...');
    const profiles = await this.prisma.jobSeekerProfile.findMany({
      include: { user: true },
    });

    for (const profile of profiles) {
      await this.evaluateMatchesForProfile(profile);
    }
  }

  // Check subscription quota: Paid (Silver/Premium) = Unlimited; Free = 1 Free Credit
  async checkEligibility(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: {
          include: {
            applications: {
              where: { coverLetter: { contains: 'Autonomous Agent' } },
            },
          },
        },
      },
    });

    if (!user || !user.jobSeekerProfile) {
      throw new NotFoundException('Job seeker profile not found');
    }

    const isPaid = user.subscriptionTier === 'SILVER' || user.subscriptionTier === 'PREMIUM';
    if (isPaid) {
      return { eligible: true, isUnlimited: true, remainingCredits: 999 };
    }

    const usedCount = user.jobSeekerProfile.applications.length;
    const remaining = Math.max(0, 1 - usedCount);

    return {
      eligible: remaining > 0,
      isUnlimited: false,
      remainingCredits: remaining,
      message: remaining > 0 
        ? 'You have 1 free autonomous application remaining.'
        : 'You have used your free autonomous application credit. Upgrade to Silver for unlimited applications!',
    };
  }

  // Seeker taps "Approve & Submit" for an autonomous match
  async approveApplication(userId: string, jobId: string) {
    const eligibility = await this.checkEligibility(userId);
    if (!eligibility.eligible) {
      throw new BadRequestException(eligibility.message);
    }

    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true },
    });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.prisma.application.findFirst({
      where: { jobId, jobSeekerId: profile.id },
    });
    if (existing) {
      return { success: true, message: 'You have already applied to this job.', application: existing };
    }

    // Submit autonomous application
    const application = await this.prisma.application.create({
      data: {
        jobId: job.id,
        jobSeekerId: profile.id,
        coverLetter: 'Automatically submitted by JobHub AI Autonomous Agent (approved by candidate).',
        status: 'APPLIED',
        aiMatchScore: 92,
      },
      include: { job: true },
    });

    // Mark approval notification as read and send confirmation notification
    await this.prisma.notification.updateMany({
      where: { userId, jobId },
      data: { isRead: true },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        jobId: job.id,
        matchProbability: 92,
        message: `🎉 Autonomous Application Submitted: Applied for "${job.title}" at "${job.employer.companyName}".`,
      },
    });

    return {
      success: true,
      message: `Autonomous application submitted for "${job.title}"!`,
      application,
    };
  }

  // Dismiss a match request
  async dismissMatch(userId: string, jobId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, jobId },
      data: { isRead: true },
    });
    return { success: true, message: 'Match dismissed.' };
  }

  // Get pending autonomous approval requests
  async getPendingApprovals(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { applications: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const appliedJobIds = profile.applications.map((a) => a.jobId);

    // Get unread autonomous notifications
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
        message: { contains: 'Permission to Apply' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const jobIds = notifications.map((n) => n.jobId).filter(Boolean) as string[];

    const jobs = await this.prisma.job.findMany({
      where: {
        id: { in: jobIds, notIn: appliedJobIds },
      },
      include: { employer: { select: { companyName: true, verificationStatus: true } } },
    });

    const eligibility = await this.checkEligibility(userId);

    return {
      eligibility,
      pendingCount: jobs.length,
      jobs,
    };
  }

  // Evaluates matches and generates permission requests
  async runForUser(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundException('Job seeker profile not found');

    const createdNotifications = await this.evaluateMatchesForProfile(profile);

    return {
      success: true,
      message: `Evaluated matches: created ${createdNotifications.length} autonomous permission requests.`,
      count: createdNotifications.length,
    };
  }

  // Evaluate matches for a profile based on skills and profession
  async evaluateMatchesForProfile(profile: any) {
    const eligibility = await this.checkEligibility(profile.userId);
    if (!eligibility.eligible) return [];

    const existingApplications = await this.prisma.application.findMany({
      where: { jobSeekerId: profile.id },
      select: { jobId: true },
    });
    const appliedJobIds = existingApplications.map((a) => a.jobId);

    const existingNotifs = await this.prisma.notification.findMany({
      where: { userId: profile.userId },
      select: { jobId: true },
    });
    const notifJobIds = existingNotifs.map((n) => n.jobId).filter(Boolean) as string[];

    const excludeJobIds = Array.from(new Set([...appliedJobIds, ...notifJobIds]));

    // Match criteria based on profile
    const skills = profile.skills || [];
    const profession = profile.profession || profile.desiredJobTitle || '';

    const matchingJobs = await this.prisma.job.findMany({
      where: {
        id: { notIn: excludeJobIds },
        OR: [
          ...(skills.length > 0 ? skills.slice(0, 5).map((s: string) => ({ title: { contains: s, mode: 'insensitive' as const } })) : []),
          ...(profession ? [{ title: { contains: profession, mode: 'insensitive' as const } }] : []),
        ],
      },
      include: { employer: true },
      take: 5,
    });

    const created: any[] = [];
    for (const job of matchingJobs) {
      const notif = await this.prisma.notification.create({
        data: {
          userId: profile.userId,
          jobId: job.id,
          matchProbability: 92,
          message: `🎯 Autonomous Match: Permission to Apply on Your Behalf for "${job.title}" at "${job.employer.companyName}". Tap to Approve.`,
        },
      });
      created.push(notif);
    }

    return created;
  }

  // When employer posts a new job, evaluate matching seekers
  async autoApplyJobForMatchingSeekers(job: any) {
    const jobText = `${job.title} ${job.description || ''} ${job.skills ? job.skills.join(' ') : ''}`.toLowerCase();
    const profiles = await this.prisma.jobSeekerProfile.findMany({
      include: { user: true },
    });

    for (const profile of profiles) {
      const eligibility = await this.checkEligibility(profile.userId);
      if (!eligibility.eligible) continue;

      const stopWords = new Set([
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
        'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
        'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
        'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'if', 'in',
        'into', 'is', 'it', 'its', 'just', 'me', 'more', 'most', 'my', 'no', 'nor', 'not', 'of', 'off',
        'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
        'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
        'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
        'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
        'work', 'working', 'team', 'company', 'role', 'year', 'years', 'experience', 'candidate',
        'looking', 'join', 'help', 'able', 'good', 'strong', 'well', 'responsible', 'skills', 'skill'
      ]);

      const jobTitleLower = (job.title || '').toLowerCase().trim();
      const profession = (profile.profession || '').toLowerCase().trim();
      const desiredTitle = (profile.desiredJobTitle || '').toLowerCase().trim();

      const hasTitleMatch = (desiredTitle.length > 2 && (jobTitleLower.includes(desiredTitle) || desiredTitle.includes(jobTitleLower))) ||
                            (profession.length > 2 && (jobTitleLower.includes(profession) || profession.includes(jobTitleLower)));

      const validSkills = (profile.skills || [])
        .map((s: string) => s.toLowerCase().trim())
        .filter((s: string) => s.length > 2 && !stopWords.has(s));

      const matchedSkillCount = validSkills.filter((s: string) => jobText.includes(s)).length;

      const isMatch = hasTitleMatch || (matchedSkillCount >= 2);
      if (!isMatch) continue;

      const existing = await this.prisma.application.findFirst({
        where: { jobId: job.id, jobSeekerId: profile.id },
      });
      if (existing) continue;

      const existingNotif = await this.prisma.notification.findFirst({
        where: { userId: profile.userId, jobId: job.id },
      });
      if (existingNotif) continue;

      // Create Permission Request Notification
      await this.prisma.notification.create({
        data: {
          userId: profile.userId,
          jobId: job.id,
          matchProbability: 92,
          message: `🎯 Autonomous Match: Permission to Apply on Your Behalf for "${job.title}". Tap to Approve.`,
        },
      });
    }
  }

  async getStatus(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        applications: {
          where: { coverLetter: { contains: 'Autonomous Agent' } },
          include: { job: { include: { employer: { select: { companyName: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }

    const eligibility = await this.checkEligibility(userId);

    return {
      autoApplyEnabled: true,
      eligibility,
      totalAutoApplied: profile.applications.length,
      applications: profile.applications,
    };
  }
}
