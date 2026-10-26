import { Controller, Post, Get, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
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
  async generateResume(@Request() req, @Body() profileData: any) {
    await this.checkGenerationLimit(req, 'resume/generate', 1500);
    const result = await this.aiService.generateResume(profileData);
    
    const resumeText = typeof result === 'string' 
      ? result 
      : (result.resume || JSON.stringify(result.structured || result));

    // Save to profile
    if (req.user.role === 'JOB_SEEKER') {
      await this.prisma.jobSeekerProfile.update({
        where: { userId: req.user.userId },
        data: { resumeContent: resumeText }
      });
    }
    return typeof result === 'object' ? result : { resume: resumeText };
  }

  @Post('company-profile/generate')
  async generateCompanyProfile(@Request() req, @Body() companyData: any) {
    if (req.user.role !== 'EMPLOYER' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only Employers can generate AI Company Profiles.');
    }
    const result = await this.aiService.generateCompanyProfile(companyData);

    if (req.user.role === 'EMPLOYER' && companyData?.autoSave) {
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

    return result;
  }

  @Post('cover-letter/generate')
  async generateCoverLetter(
    @Request() req,
    @Body('profile') profileData: any,
    @Body('job') jobData: any,
  ) {
    await this.checkGenerationLimit(req, 'cover-letter/generate', 1200);
    const cover_letter = await this.aiService.generateCoverLetter(
      profileData,
      jobData,
    );
    return { cover_letter };
  }

  @Post('match/score')
  async getMatchScore(
    @Body('profile_text') profileText: string,
    @Body('job_description_text') jobText: string,
  ) {
    const score = await this.aiService.calculateMatchScore(profileText, jobText);
    return { match_score: score };
  }

  @Post('profile/score')
  async getProfileScore(@Request() req, @Body() profileData: any) {
    await this.checkGenerationLimit(req, 'profile/score', 800);
    return this.aiService.getProfileScore(profileData);
  }

  @Post('skills/gap')
  async getSkillGap(@Request() req, @Body('profile') profileData: any, @Body('job') jobData: any) {
    await this.checkGenerationLimit(req, 'skills/gap', 800);
    return this.aiService.getSkillGap(profileData, jobData);
  }

  @Post('salary/estimate')
  async getSalaryEstimate(@Request() req, @Body('job_title') jobTitle: string, @Body('location') location: string, @Body('experience_years') exp: number) {
    return this.aiService.getSalaryEstimate(jobTitle, location, exp);
  }

  @Post('career/suggestions')
  async getCareerSuggestions(@Request() req, @Body() profileData: any) {
    await this.checkGenerationLimit(req, 'career/suggestions', 800);
    return this.aiService.getCareerSuggestions(profileData);
  }

  @Post('interview/questions')
  async getInterviewQuestions(@Request() req, @Body('job') jobData: any, @Body('profile') profileData: any) {
    await this.checkGenerationLimit(req, 'interview/questions', 1000);
    return this.aiService.getInterviewQuestions(jobData, profileData);
  }

  @Post('job-description/generate')
  async generateJobDescription(@Request() req, @Body() jobData: any) {
    await this.checkGenerationLimit(req, 'job-description/generate', 1000);
    return this.aiService.generateJobDescription(jobData);
  }

  @Post('fraud/detect')
  async detectFraud(@Request() req, @Body('content') content: string) {
    return this.aiService.detectFraud(content);
  }

  @Post('mentor/chat')
  async mentorChat(@Request() req, @Body('message') message: string) {
    await this.checkGenerationLimit(req, 'mentor/chat', 600);
    return this.aiService.mentorChat(req.user.userId, message);
  }
}
