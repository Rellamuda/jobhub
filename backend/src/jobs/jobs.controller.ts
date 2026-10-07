import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createJob(@Request() req, @Body() data: Prisma.JobCreateWithoutEmployerInput) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only EMPLOYERs can post jobs.');
    }
    return this.jobsService.createJob(req.user.userId, data);
  }

  @Get('employer/me')
  @UseGuards(JwtAuthGuard)
  async findMyJobs(@Request() req) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only EMPLOYERs can view their posted jobs.');
    }
    return this.jobsService.findEmployerJobs(req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findFeed(@Request() req, @Param('type') type?: string) {
    // If we want to filter by type via query, we could add @Query('type') but for brevity we'll just let service handle it if passed.
    return this.jobsService.findFeed(req.user.userId);
  }

  @Get('marketplace')
  @UseGuards(JwtAuthGuard)
  async getMarketplace(@Request() req) {
    return this.jobsService.findMarketplace(req.user.userId);
  }

  @Get('internships')
  @UseGuards(JwtAuthGuard)
  async getInternships(@Request() req) {
    return this.jobsService.findInternships(req.user.userId);
  }

  @Get(':id/matches')
  @UseGuards(JwtAuthGuard)
  async getMatches(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only EMPLOYERs can view matches.');
    }
    return this.jobsService.findMatchesForJob(req.user.userId, id);
  }

  @Post(':id/refer')
  @UseGuards(JwtAuthGuard)
  async referCandidate(@Request() req, @Param('id') jobId: string, @Body('candidateEmail') candidateEmail: string) {
    return this.jobsService.referCandidate(req.user.userId, jobId, candidateEmail);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }
}
