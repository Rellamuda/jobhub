import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicationStatus } from '@prisma/client';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post(':jobId/apply')
  async apply(@Request() req, @Param('jobId') jobId: string, @Body() body: { coverLetter?: string }) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only Job Seekers can apply for jobs.');
    }
    return this.applicationsService.applyToJob(req.user.userId, jobId, body.coverLetter);
  }

  @Post(':jobId/one-tap')
  async applyOneTap(@Request() req, @Param('jobId') jobId: string, @Body() body: { resumeId: string }) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only Job Seekers can apply for jobs.');
    }
    return this.applicationsService.applyOneTap(req.user.userId, jobId, body.resumeId);
  }

  @Post(':jobId/invite')
  async invite(@Request() req, @Param('jobId') jobId: string, @Body() body: { jobSeekerId: string }) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only Employers can invite candidates.');
    }
    return this.applicationsService.inviteCandidate(req.user.userId, jobId, body.jobSeekerId);
  }

  @Patch(':id/seeker-status')
  async seekerUpdateStatus(@Request() req, @Param('id') id: string, @Body() body: { status: ApplicationStatus }) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only Job Seekers can respond to invitations.');
    }
    return this.applicationsService.seekerUpdateStatus(req.user.userId, id, body.status);
  }

  @Get('my-applications')
  async getMyApplications(@Request() req) {
    if (req.user.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only Job Seekers can view their applications.');
    }
    return this.applicationsService.getMyApplications(req.user.userId);
  }

  @Get('job/:jobId')
  async getJobApplications(@Request() req, @Param('jobId') jobId: string) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only Employers can view job applications.');
    }
    return this.applicationsService.getJobApplications(req.user.userId, jobId);
  }

  @Patch(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body() body: { status: ApplicationStatus }) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only Employers can update application statuses.');
    }
    return this.applicationsService.updateStatus(req.user.userId, id, body.status);
  }

  @Post(':id/schedule-interview')
  async scheduleInterview(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { interviewDate: string; interviewLink?: string }
  ) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only Employers can schedule interviews.');
    }
    return this.applicationsService.scheduleInterview(req.user.userId, id, body.interviewDate, body.interviewLink);
  }
}
