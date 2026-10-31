import { Controller, Post, Get, Body, UseGuards, Request, ForbiddenException, Logger, HttpCode } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly aiRateLimiter: AiRateLimiterService,
  ) {}

  private async checkGenerationLimit(req: any, endpoint = 'ai/generate', estimatedChars = 600) {
    const rawIp = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '';
    await this.aiRateLimiter.checkQuotaAndIncrement(req.user.userId, endpoint, estimatedChars, clientIp);
  }

  @Get('quota')
  async getQuota(@Request() req) {
    return this.aiRateLimiter.getUserQuota(req.user.userId);
  }

  @Get('admin/monitoring')
  async getAdminMonitoring(@Request() req) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only Administrators can view AI telemetry.');
    }
    return this.aiRateLimiter.getAdminMonitoring();
  }

  @Post('resume/generate')
  @HttpCode(200)
  async generateResume(@Request() req, @Body() profileData: any) {
    await this.checkGenerationLimit(req, 'resume/generate', 1500);
    const result = await this.aiService.generateResume(profileData);
    
    const resumeText = typeof result === 'string' 
      ? result 
      : (result.resume || JSON.stringify(result.structured || result));

    // Save to profile if job seeker
    if (req.user?.role === 'JOB_SEEKER' && req.user?.userId) {
      try {
        const existing = await this.prisma.jobSeekerProfile.findUnique({
          where: { userId: req.user.userId },
        });

        if (existing) {
          await this.prisma.jobSeekerProfile.update({
            where: { userId: req.user.userId },
            data: { resumeContent: resumeText },
          });
        } else {
          await this.prisma.jobSeekerProfile.create({
            data: {
              userId: req.user.userId,
              firstName: profileData?.firstName || profileData?.personalInfo?.firstName || 'Candidate',
              lastName: profileData?.lastName || profileData?.personalInfo?.lastName || '',
              profession: profileData?.desiredJobTitle || profileData?.title || 'Professional',
              resumeContent: resumeText,
            },
          });
        }
      } catch (err: any) {
        this.logger.warn(`Could not persist resumeContent to JobSeekerProfile: ${err?.message || err}`);
      }
    }
    return typeof result === 'object' ? result : { resume: resumeText };
  }

  @Post('company-profile/generate')
  @HttpCode(200)
  async generateCompanyProfile(@Request() req, @Body() companyData: any) {
    if (req.user.role !== 'EMPLOYER' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only Employers can generate AI Company Profiles.');
    }
    const result = await this.aiService.generateCompanyProfile(companyData);

    if (req.user?.role === 'EMPLOYER' && companyData?.autoSave && req.user?.userId) {
      try {
        const existing = await this.prisma.employer.findUnique({
          where: { userId: req.user.userId },
        });

        if (existing) {
          await this.prisma.employer.update({
            where: { userId: req.user.userId },
            data: {
              description: result.description,
              mission: result.mission,
              vision: result.vision,
              coreValues: result.coreValues,
              culture: result.culture,
              whyWorkWithUs: result.whyWorkWithUs,
              benefits: result.benefits,
              ...(result.industry ? { industry: result.industry } : {}),
              ...(result.businessType ? { businessType: result.businessType } : {}),
            }
          });
        }
      } catch (err: any) {
        this.logger.warn(`Could not autoSave company profile: ${err?.message || err}`);
      }
    }

    return result;
  }

  @Post('cover-letter/generate')
  @HttpCode(200)
  async generateCoverLetter(
    @Request() req,
    @Body() body: any,
  ) {
    await this.checkGenerationLimit(req, 'cover-letter/generate', 1200);
    let profileData = body?.profile;
    let jobData = body?.job;

    if (!profileData && req.user?.userId) {
      profileData = await this.prisma.jobSeekerProfile.findUnique({
        where: { userId: req.user.userId },
      });
    }

    if (!jobData && body?.jobId) {
      jobData = await this.prisma.job.findUnique({
        where: { id: body.jobId },
        include: { employer: true },
      });
    }

    const cover_letter = await this.aiService.generateCoverLetter(
      profileData || { firstName: 'Candidate', lastName: '', skills: [] },
      jobData || { title: body?.jobTitle || 'Role', description: body?.jobDescription || '' },
    );
    return { cover_letter, coverLetter: cover_letter };
  }

  @Post('match/score')
  @HttpCode(200)
  async getMatchScore(
    @Body('profile_text') profileText: string,
    @Body('job_description_text') jobText: string,
  ) {
    const score = await this.aiService.calculateMatchScore(profileText, jobText);
    return { match_score: score };
  }

  @Post('profile/score')
  @HttpCode(200)
  async getProfileScore(@Request() req, @Body() profileData: any) {
    await this.aiRateLimiter.recordLightweightCall(req.user.userId, 'profile/score', 400);
    return this.aiService.getProfileScore(profileData);
  }

  @Post('skills/gap')
  @HttpCode(200)
  async getSkillGap(@Request() req, @Body('profile') profileData: any, @Body('job') jobData: any) {
    await this.aiRateLimiter.recordLightweightCall(req.user.userId, 'skills/gap', 400);
    return this.aiService.getSkillGap(profileData, jobData);
  }

  @Post('salary/estimate')
  @HttpCode(200)
  async getSalaryEstimate(@Request() req, @Body('job_title') jobTitle: string, @Body('location') location: string, @Body('experience_years') exp: number) {
    await this.aiRateLimiter.recordLightweightCall(req.user.userId, 'salary/estimate', 300);
    return this.aiService.getSalaryEstimate(jobTitle, location, exp);
  }

  @Post('career/suggestions')
  @HttpCode(200)
  async getCareerSuggestions(@Request() req, @Body() profileData: any) {
    await this.aiRateLimiter.recordLightweightCall(req.user.userId, 'career/suggestions', 400);
    return this.aiService.getCareerSuggestions(profileData);
  }

  @Post('interview/questions')
  @HttpCode(200)
  async getInterviewQuestions(@Request() req, @Body('job') jobData: any, @Body('profile') profileData: any) {
    await this.aiRateLimiter.recordLightweightCall(req.user.userId, 'interview/questions', 800);
    return this.aiService.getInterviewQuestions(jobData, profileData);
  }

  @Post('job-description/generate')
  @HttpCode(200)
  async generateJobDescription(@Request() req, @Body() jobData: any) {
    await this.checkGenerationLimit(req, 'job-description/generate', 1000);
    return this.aiService.generateJobDescription(jobData);
  }

  @Post('fraud/detect')
  @HttpCode(200)
  async detectFraud(@Request() req, @Body('content') content: string) {
    return this.aiService.detectFraud(content);
  }

  @Post('mentor/chat')
  @HttpCode(200)
  async mentorChat(@Request() req, @Body('message') message: string) {
    await this.aiRateLimiter.recordLightweightCall(req.user.userId, 'mentor/chat', 600);
    return this.aiService.mentorChat(req.user.userId, message);
  }
}
