import { Controller, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService
  ) {}

  private async checkGenerationLimit(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');
    
    if (user.subscriptionTier === 'FREE') {
      if (user.freeGenerationsUsed >= 1) {
        throw new ForbiddenException('Free generation limit reached. Please upgrade to Premium.');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { freeGenerationsUsed: { increment: 1 } }
      });
    }
  }

  @Post('resume/generate')
  async generateResume(@Request() req, @Body() profileData: any) {
    await this.checkGenerationLimit(req.user.userId);
    const resume = await this.aiService.generateResume(profileData);
    
    // Save to profile
    if (req.user.role === 'JOB_SEEKER') {
      await this.prisma.jobSeekerProfile.update({
        where: { userId: req.user.userId },
        data: { resumeContent: resume }
      });
    }
    return { resume };
  }

  @Post('cover-letter/generate')
  async generateCoverLetter(
    @Request() req,
    @Body('profile') profileData: any,
    @Body('job') jobData: any,
  ) {
    await this.checkGenerationLimit(req.user.userId);
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
    await this.checkGenerationLimit(req.user.userId);
    return this.aiService.getProfileScore(profileData);
  }

  @Post('skills/gap')
  async getSkillGap(@Request() req, @Body('profile') profileData: any, @Body('job') jobData: any) {
    await this.checkGenerationLimit(req.user.userId);
    return this.aiService.getSkillGap(profileData, jobData);
  }

  @Post('salary/estimate')
  async getSalaryEstimate(@Request() req, @Body('job_title') jobTitle: string, @Body('location') location: string, @Body('experience_years') exp: number) {
    return this.aiService.getSalaryEstimate(jobTitle, location, exp);
  }

  @Post('career/suggestions')
  async getCareerSuggestions(@Request() req, @Body() profileData: any) {
    await this.checkGenerationLimit(req.user.userId);
    return this.aiService.getCareerSuggestions(profileData);
  }

  @Post('interview/questions')
  async getInterviewQuestions(@Request() req, @Body('job') jobData: any, @Body('profile') profileData: any) {
    await this.checkGenerationLimit(req.user.userId);
    return this.aiService.getInterviewQuestions(jobData, profileData);
  }

  @Post('job-description/generate')
  async generateJobDescription(@Request() req, @Body() jobData: any) {
    await this.checkGenerationLimit(req.user.userId);
    return this.aiService.generateJobDescription(jobData);
  }

  @Post('fraud/detect')
  async detectFraud(@Request() req, @Body('content') content: string) {
    if (req.user.role !== 'ADMIN') {
      // In a real scenario, this might be internal or admin only. 
      // For now, allow it or enforce admin. We will allow employers/admins to check.
    }
    return this.aiService.detectFraud(content);
  }

  @Post('mentor/chat')
  async mentorChat(@Request() req, @Body('message') message: string) {
    await this.checkGenerationLimit(req.user.userId);
    return this.aiService.mentorChat(req.user.userId, message);
  }
}
