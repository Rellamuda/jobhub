import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ApplicationStatus } from '@prisma/client';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async applyToJob(userId: string, jobId: string, coverLetter?: string) {
    const jobSeekerProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!jobSeekerProfile) {
      throw new ForbiddenException('You must create a Job Seeker profile before applying.');
    }

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found.');

    const existingApp = await this.prisma.application.findFirst({
      where: { jobId, jobSeekerId: jobSeekerProfile.id },
    });

    if (existingApp) {
      throw new ConflictException('You have already applied to this job.');
    }

    // Calculate actual AI match score based on candidate profile and job description
    let matchScore = 85.0;
    try {
      const profileText = `${jobSeekerProfile.bio || ''} ${jobSeekerProfile.skills.join(', ')}`;
      const jobText = `${job.title} ${job.description}`;
      matchScore = await this.aiService.calculateMatchScore(profileText, jobText);
    } catch (err) {
      console.error('Failed to calculate AI match score:', err);
    }

    return this.prisma.application.create({
      data: {
        job: { connect: { id: jobId } },
        jobSeekerProfile: { connect: { id: jobSeekerProfile.id } },
        coverLetter,
        aiMatchScore: matchScore,
        status: ApplicationStatus.APPLIED,
      },
    });
  }

  async applyOneTap(userId: string, jobId: string, resumeId: string) {
    const jobSeekerProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!jobSeekerProfile) throw new ForbiddenException('Profile not found.');

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found.');

    const existingApp = await this.prisma.application.findFirst({
      where: { jobId, jobSeekerId: jobSeekerProfile.id },
    });

    if (existingApp) throw new ConflictException('Already applied.');

    // Fetch the resume text if resumeId is provided
    let resumeText = '';
    if (resumeId) {
      const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
      if (resume) {
        resumeText = `${resume.summary || ''} ${JSON.stringify(resume.skills || [])} ${JSON.stringify(resume.experience || [])}`;
      }
    }

    // Calculate actual AI match score
    let matchScore = 85.0;
    try {
      const profileText = resumeText || `${jobSeekerProfile.bio || ''} ${jobSeekerProfile.skills.join(', ')}`;
      const jobText = `${job.title} ${job.description}`;
      matchScore = await this.aiService.calculateMatchScore(profileText, jobText);
    } catch (err) {
      console.error('Failed to calculate AI match score in one tap:', err);
    }

    // Generate cover letter using AI Service
    let generatedCoverLetter = `Dear Hiring Manager, based on my portfolio and resume, I am an excellent fit for the ${job.title} position...`;
    try {
      generatedCoverLetter = await this.aiService.generateCoverLetter(jobSeekerProfile, job);
    } catch (err) {
      console.error('Failed to generate cover letter in one-tap:', err);
    }

    return this.prisma.application.create({
      data: {
        jobId,
        jobSeekerId: jobSeekerProfile.id,
        resumeId,
        portfolioData: jobSeekerProfile.portfolio ?? Prisma.JsonNull,
        certificatesData: jobSeekerProfile.certificates ?? Prisma.JsonNull,
        coverLetter: generatedCoverLetter,
        aiMatchScore: matchScore,
        status: ApplicationStatus.APPLIED,
      }
    });
  }

  async getMyApplications(userId: string) {
    const jobSeekerProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!jobSeekerProfile) return [];

    return this.prisma.application.findMany({
      where: { jobSeekerId: jobSeekerProfile.id },
      include: {
        job: {
          include: { employer: { select: { companyName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobApplications(userId: string, jobId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) throw new ForbiddenException('Employer profile not found.');

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) {
      throw new ForbiddenException('You do not own this job posting.');
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        jobSeekerProfile: true,
      },
      orderBy: [
        { aiMatchScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async updateStatus(employerUserId: string, applicationId: string, status: ApplicationStatus) {
    // Verify employer owns the job
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const employer = await this.prisma.employer.findUnique({
      where: { userId: employerUserId },
    });

    if (application.job.employerId !== employer?.id) {
      throw new ForbiddenException('You do not have permission to update this application.');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  }

  async inviteCandidate(employerUserId: string, jobId: string, jobSeekerUserId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId: employerUserId } });
    if (!employer) throw new ForbiddenException('Employer profile required.');

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) throw new ForbiddenException('You do not own this job.');

    const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId: jobSeekerUserId } });
    if (!profile) throw new NotFoundException('Job seeker not found.');

    const existingApp = await this.prisma.application.findFirst({
      where: { jobId, jobSeekerId: profile.id }
    });

    if (existingApp) {
      return this.prisma.application.update({
        where: { id: existingApp.id },
        data: { status: 'INVITED' }
      });
    }

    return this.prisma.application.create({
      data: {
        jobId,
        jobSeekerId: profile.id,
        status: 'INVITED'
      }
    });
  }

  async seekerUpdateStatus(jobSeekerUserId: string, applicationId: string, status: ApplicationStatus) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId: jobSeekerUserId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application || application.jobSeekerId !== profile.id) {
      throw new ForbiddenException('Not your application');
    }

    // Only allow specific transitions like accepting or declining offers/invitations
    if (!['ACCEPTED_OFFER', 'DECLINED_OFFER'].includes(status)) {
      throw new ForbiddenException('Invalid status update for job seeker');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status }
    });
  }

  async scheduleInterview(employerUserId: string, applicationId: string, interviewDate: string, interviewLink?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const employer = await this.prisma.employer.findUnique({
      where: { userId: employerUserId },
    });

    if (application.job.employerId !== employer?.id) {
      throw new ForbiddenException('You do not have permission to update this application.');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { 
        status: 'INVITED',
        interviewDate: new Date(interviewDate),
        interviewLink
      },
    });
  }
}
