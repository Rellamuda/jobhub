import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, ForbiddenException, Param, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly prisma: PrismaService
  ) {}

  @Post('upgrade')
  async upgradeToPremium(@Request() req) {
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { subscriptionTier: 'PREMIUM' }
    });
    return { success: true, message: 'Upgraded to Premium' };
  }

  @Post('verify/request')
  async requestVerification(@Request() req, @Body() data: any) {
    const userId = req.user.userId;
    if (req.user.role === 'JOB_SEEKER') {
      await this.prisma.jobSeekerProfile.update({
        where: { userId },
        data: { verificationStatus: 'PENDING', verificationDocs: data.docs || {} }
      });
    } else if (req.user.role === 'EMPLOYER') {
      await this.prisma.employer.update({
        where: { userId },
        data: { verificationStatus: 'PENDING' }
      });
    }
    return { success: true, message: 'Verification request submitted. Status is now PENDING.' };
  }

  @Post('job-seeker')
  async upsertJobSeekerProfile(@Request() req, @Body() data: Prisma.JobSeekerProfileUpdateInput & Prisma.JobSeekerProfileCreateWithoutUserInput) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only JOB_SEEKERs can create this profile type.');
    }
    // ensure skills is initialized if undefined
    if (data.skills === undefined) {
      data.skills = [];
    }
    return this.profilesService.upsertJobSeekerProfile(req.user.userId, data);
  }

  @Get('talent')
  @UseGuards(JwtAuthGuard)
  async searchTalent(@Request() req, @Query('skill') skill?: string) {
    if (req.user.role !== 'EMPLOYER' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only employers can search talent pools.');
    }
    return this.profilesService.searchTalent(skill);
  }

  @Get('notifications')
  async getNotifications(@Request() req) {
    return this.profilesService.getNotifications(req.user.userId);
  }

  @Delete('notifications/:id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    return this.profilesService.deleteNotification(req.user.userId, id);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.profilesService.getReferralLeaderboard();
  }

  @Get('job-seeker')
  async getJobSeekerProfile(@Request() req) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only JOB_SEEKERs can view this profile type.');
    }
    return this.profilesService.getJobSeekerProfile(req.user.userId);
  }

  @Post('employer')
  async upsertEmployerProfile(@Request() req, @Body() data: Prisma.EmployerUpdateInput & Prisma.EmployerCreateWithoutUserInput) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only EMPLOYERs can create this profile type.');
    }
    return this.profilesService.upsertEmployerProfile(req.user.userId, data);
  }

  @Get('employer')
  async getEmployerProfile(@Request() req) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only EMPLOYERs can view this profile type.');
    }
    return this.profilesService.getEmployerProfile(req.user.userId);
  }

  @Get('job-seeker/completion')
  async getJobSeekerCompletion(@Request() req) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only JOB_SEEKERs can view this profile type.');
    }
    return this.profilesService.getJobSeekerCompletionPercentage(req.user.userId);
  }

  @Get('employer/:id/public')
  async getPublicEmployerProfile(@Request() req, @Param('id') id: string) {
    return this.profilesService.getPublicEmployerProfile(id);
  }

  @Get('credentials')
  async getCredentials(@Request() req) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId: req.user.userId },
      include: { credentials: true }
    });
    return profile?.credentials || [];
  }

  @Post('credentials')
  async addCredential(@Request() req, @Body() data: any) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId: req.user.userId }
    });
    if (!profile) {
      throw new ForbiddenException('Job seeker profile not found');
    }
    return this.prisma.credential.create({
      data: {
        jobSeekerProfileId: profile.id,
        type: data.type || 'CERTIFICATE',
        name: data.name,
        issuer: data.issuer,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        documentUrl: data.documentUrl || '',
        verificationStatus: 'PENDING'
      }
    });
  }

  @Delete('credentials/:id')
  async deleteCredential(@Request() req, @Param('id') id: string) {
    return this.prisma.credential.delete({
      where: { id }
    });
  }
}

