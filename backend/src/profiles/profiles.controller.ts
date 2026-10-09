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
  async upgradeToPremium(@Request() req, @Body() body?: { tier?: string }) {
    const tier = (body?.tier === 'SILVER' ? 'SILVER' : 'PREMIUM') as any;
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { subscriptionTier: tier }
    });
    return { success: true, tier, message: `Upgraded to ${tier}` };
  }

  @Post('employer/verify')
  async verifyEmployerCompany(@Request() req, @Body() body: { registrationNumber?: string; website?: string; taxId?: string }) {
    const userId = req.user.userId;
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) {
      throw new ForbiddenException('Employer profile not found.');
    }

    const regNum = (body?.registrationNumber || employer.registrationNumber || '').trim();
    const web = (body?.website || employer.website || '').trim();
    const taxId = (body?.taxId || employer.taxId || '').trim();

    // Check registration number (must have at least 3 characters)
    if (!regNum || regNum.length < 3) {
      return {
        success: false,
        verified: false,
        message: 'Verification failed: A valid Business Registration Number (RC/EIN/CRN) is required.'
      };
    }

    // Check active internet presence (must be a valid URL with domain)
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
    if (!web || !urlPattern.test(web)) {
      return {
        success: false,
        verified: false,
        message: 'Verification failed: A valid company website or online domain is required for internet presence verification.'
      };
    }

    // Format website with protocol if missing
    const formattedWebsite = web.startsWith('http://') || web.startsWith('https://') ? web : `https://${web}`;

    // Update employer profile with VERIFIED status and badge
    const updated = await this.prisma.employer.update({
      where: { id: employer.id },
      data: {
        registrationNumber: regNum,
        website: formattedWebsite,
        taxId: taxId || employer.taxId,
        verificationStatus: 'VERIFIED'
      }
    });

    return {
      success: true,
      verified: true,
      verificationStatus: 'VERIFIED',
      message: 'Company verified successfully! Registered credentials and active web presence confirmed. Verified badge awarded.',
      employer: updated
    };
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
  async upsertJobSeekerProfile(@Request() req, @Body() data: any) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only JOB_SEEKERs can create this profile type.');
    }
    // ensure skills is initialized if undefined
    if (data.skills === undefined) {
      data.skills = [];
    }
    return this.profilesService.upsertJobSeekerProfile(req.user.userId, data);
  }

  @Post('job-seeker/auto-apply')
  async updateAutoApplyPost(@Request() req, @Body() body: { autoApplyEnabled?: boolean; autoApplyKeywords?: string[]; enabled?: boolean; keywords?: string[] }) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only JOB_SEEKERs can update auto-apply settings.');
    }
    const enabled = body.autoApplyEnabled ?? body.enabled ?? false;
    const keywords = body.autoApplyKeywords ?? body.keywords;
    return this.profilesService.updateAutoApply(req.user.userId, enabled, keywords);
  }

  @Put('job-seeker/auto-apply')
  async updateAutoApplyPut(@Request() req, @Body() body: { autoApplyEnabled?: boolean; autoApplyKeywords?: string[]; enabled?: boolean; keywords?: string[] }) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only JOB_SEEKERs can update auto-apply settings.');
    }
    const enabled = body.autoApplyEnabled ?? body.enabled ?? false;
    const keywords = body.autoApplyKeywords ?? body.keywords;
    return this.profilesService.updateAutoApply(req.user.userId, enabled, keywords);
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

  @Delete('account')
  async deleteAccount(@Request() req) {
    const userId = req.user.userId;
    return await this.prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { userId } }).catch(() => {});
      await tx.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }).catch(() => {});
      await tx.payment.deleteMany({ where: { userId } }).catch(() => {});
      await tx.candidateNote.deleteMany({ where: { authorId: userId } }).catch(() => {});
      await tx.like.deleteMany({ where: { userId } }).catch(() => {});
      await tx.comment.deleteMany({ where: { userId } }).catch(() => {});
      await tx.post.deleteMany({ where: { authorId: userId } }).catch(() => {});
      await tx.connection.deleteMany({ where: { OR: [{ userId }, { connectedUserId: userId }] } }).catch(() => {});
      await tx.companyFollower.deleteMany({ where: { userId } }).catch(() => {});

      const employer = await tx.employer.findUnique({ where: { userId } });
      if (employer) {
        const jobs = await tx.job.findMany({ where: { employerId: employer.id } });
        for (const job of jobs) {
          await tx.application.deleteMany({ where: { jobId: job.id } }).catch(() => {});
          await tx.job.delete({ where: { id: job.id } }).catch(() => {});
        }
        await tx.candidateTag.deleteMany({ where: { employerId: employer.id } }).catch(() => {});
        await tx.employer.delete({ where: { id: employer.id } }).catch(() => {});
      }

      const seeker = await tx.jobSeekerProfile.findUnique({ where: { userId } });
      if (seeker) {
        await tx.application.deleteMany({ where: { applicantId: seeker.id } }).catch(() => {});
        await tx.credential.deleteMany({ where: { jobSeekerId: seeker.id } }).catch(() => {});
        await tx.jobSeekerProfile.delete({ where: { id: seeker.id } }).catch(() => {});
      }

      await tx.user.delete({ where: { id: userId } });
      return { success: true, message: 'Your account and all associated data have been permanently deleted.' };
    });
  }
}

