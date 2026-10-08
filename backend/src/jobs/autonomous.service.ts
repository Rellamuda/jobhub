import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutonomousService {
  private readonly logger = new Logger(AutonomousService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running autonomous applications for users...');
    
    const profiles = await this.prisma.jobSeekerProfile.findMany({
      where: { autoApplyEnabled: true },
    });

    for (const profile of profiles) {
      await this.processApplicationsForProfile(profile);
    }
  }

  async runForUser(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }

    const appliedJobs = await this.processApplicationsForProfile(profile);
    return {
      success: true,
      message: `Autonomous agent applied to ${appliedJobs.length} matching jobs!`,
      appliedCount: appliedJobs.length,
      jobs: appliedJobs,
    };
  }

  async updateSettings(userId: string, enabled: boolean, keywords?: string[]) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }

    const updated = await this.prisma.jobSeekerProfile.update({
      where: { id: profile.id },
      data: {
        autoApplyEnabled: enabled,
        ...(keywords ? { autoApplyKeywords: keywords } : {}),
      },
    });

    return {
      success: true,
      autoApplyEnabled: updated.autoApplyEnabled,
      autoApplyKeywords: updated.autoApplyKeywords,
    };
  }

  async getStatus(userId: string) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        applications: {
          where: { coverLetter: { contains: 'JobHub AI Autonomous Agent' } },
          include: { job: { include: { employer: { select: { companyName: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }

    return {
      autoApplyEnabled: profile.autoApplyEnabled,
      autoApplyKeywords: profile.autoApplyKeywords || [],
      totalAutoApplied: profile.applications.length,
      applications: profile.applications,
    };
  }

  async autoApplyJobForMatchingSeekers(job: any) {
    this.logger.debug(`Evaluating autonomous applications for new job: ${job.title}`);
    const profiles = await this.prisma.jobSeekerProfile.findMany({
      where: { autoApplyEnabled: true },
    });

    const jobText = `${job.title} ${job.description || ''} ${job.skills ? job.skills.join(' ') : ''}`.toLowerCase();

    for (const profile of profiles) {
      const keywords = [
        ...(profile.autoApplyKeywords || []),
        ...(profile.skills || []),
        profile.profession || '',
        profile.desiredJobTitle || '',
      ].filter(Boolean).map(k => k.toLowerCase().trim());

      const isMatch = keywords.some(k => k.length > 2 && jobText.includes(k));
      if (!isMatch) continue;

      const existing = await this.prisma.application.findFirst({
        where: { jobId: job.id, jobSeekerId: profile.id },
      });
      if (existing) continue;

      await this.prisma.application.create({
        data: {
          jobId: job.id,
          jobSeekerId: profile.id,
          coverLetter: 'Automatically applied by JobHub AI Autonomous Agent.',
          status: 'APPLIED',
          aiMatchScore: 92,
        },
      });

      await this.prisma.notification.create({
        data: {
          userId: profile.userId,
          jobId: job.id,
          matchProbability: 92,
          message: `🤖 Auto-Applied: Your Autonomous Agent submitted an application for "${job.title}".`,
        },
      });
    }
  }

  private async processApplicationsForProfile(profile: any) {
    const keywords = [
      ...(profile.autoApplyKeywords || []),
      ...(profile.skills || []),
      profile.profession || '',
      profile.desiredJobTitle || '',
    ].filter(Boolean);

    let whereClause: any = {
      NOT: {
        applications: {
          some: {
            jobSeekerId: profile.id,
          },
        },
      },
    };

    if (keywords.length > 0) {
      whereClause.OR = keywords.slice(0, 10).map((k) => ({
        OR: [
          { title: { contains: k, mode: 'insensitive' } },
          { description: { contains: k, mode: 'insensitive' } },
        ],
      }));
    }

    const matchingJobs = await this.prisma.job.findMany({
      where: whereClause,
      take: 5,
    });

    const applied: any[] = [];
    for (const job of matchingJobs) {
      this.logger.debug(`Auto-applying ${profile.id} to job ${job.id}`);
      const app = await this.prisma.application.create({
        data: {
          jobId: job.id,
          jobSeekerId: profile.id,
          coverLetter: 'Automatically applied by JobHub AI Autonomous Agent.',
          status: 'APPLIED',
          aiMatchScore: 90,
        },
        include: { job: true },
      });
      applied.push(app);

      await this.prisma.notification.create({
        data: {
          userId: profile.userId,
          jobId: job.id,
          matchProbability: 90,
          message: `🤖 Auto-Applied: Your Autonomous Agent submitted an application for "${job.title}".`,
        },
      });
    }

    return applied;
  }
}
