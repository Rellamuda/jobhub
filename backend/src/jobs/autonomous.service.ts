import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutonomousService {
  private readonly logger = new Logger(AutonomousService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running autonomous applications for users...');
    
    // Find all job seekers who have auto-apply enabled
    const profiles = await this.prisma.jobSeekerProfile.findMany({
      where: { autoApplyEnabled: true },
    });

    for (const profile of profiles) {
      if (!profile.autoApplyKeywords || profile.autoApplyKeywords.length === 0) {
        continue;
      }

      // Find jobs that match any of the keywords and the user hasn't applied to yet
      const matchingJobs = await this.prisma.job.findMany({
        where: {
          OR: profile.autoApplyKeywords.map((keyword) => ({
            title: { contains: keyword, mode: 'insensitive' },
          })),
          NOT: {
            applications: {
              some: {
                jobSeekerId: profile.id,
              },
            },
          },
        },
        take: 5, // Limit auto-applications per run
      });

      for (const job of matchingJobs) {
        this.logger.debug(`Auto-applying ${profile.id} to job ${job.id}`);
        await this.prisma.application.create({
          data: {
            jobId: job.id,
            jobSeekerId: profile.id,
            coverLetter: 'Automatically applied by JobHub AI Autonomous Agent.',
            status: 'APPLIED',
          },
        });
      }
    }
  }
}
