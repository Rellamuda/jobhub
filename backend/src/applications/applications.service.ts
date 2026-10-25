import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ApplicationStatus } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private mailService: MailService,
  ) {}

  private async ensureResumeForProfile(jobSeekerProfile: any, resumeId?: string): Promise<string | null> {
    if (resumeId) {
      const exists = await this.prisma.resume.findUnique({ where: { id: resumeId } });
      if (exists) return exists.id;
    }

    const latestResume = await this.prisma.resume.findFirst({
      where: { jobSeekerId: jobSeekerProfile.id },
      orderBy: { updatedAt: 'desc' },
    });
    if (latestResume) return latestResume.id;

    try {
      const newResume = await this.prisma.resume.create({
        data: {
          jobSeekerId: jobSeekerProfile.id,
          title: `${jobSeekerProfile.firstName} ${jobSeekerProfile.lastName} - Resume`,
          summary: jobSeekerProfile.summary || jobSeekerProfile.bio || `Professional ${jobSeekerProfile.desiredJobTitle || jobSeekerProfile.profession || 'Specialist'}`,
          skills: jobSeekerProfile.skills || [],
          experience: jobSeekerProfile.experience || [],
          education: jobSeekerProfile.education || [],
          projects: jobSeekerProfile.projects || [],
          certifications: jobSeekerProfile.certificates || jobSeekerProfile.professionalCertifications || [],
          personalInfo: {
            firstName: jobSeekerProfile.firstName,
            lastName: jobSeekerProfile.lastName,
            phone: jobSeekerProfile.phone,
            city: jobSeekerProfile.residenceCity || jobSeekerProfile.residenceCountry,
          },
        },
      });
      return newResume.id;
    } catch {
      return null;
    }
  }

  async applyToJob(userId: string, jobId: string, coverLetter?: string, resumeId?: string) {
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

    // Auto-attach active, latest, or synthesized resume so application always includes resume
    const attachedResumeId = await this.ensureResumeForProfile(jobSeekerProfile, resumeId);

    // Default/AI cover letter if not provided
    let finalCoverLetter = coverLetter?.trim();
    if (!finalCoverLetter) {
      try {
        finalCoverLetter = await this.aiService.generateCoverLetter(jobSeekerProfile, job);
      } catch (err) {
        finalCoverLetter = `Dear Hiring Manager,\n\nI am excited to submit my verified profile and application for the ${job.title} position. My background aligns strongly with your requirements.\n\nBest regards,\n${jobSeekerProfile.firstName} ${jobSeekerProfile.lastName}`;
      }
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
        ...(attachedResumeId ? { resume: { connect: { id: attachedResumeId } } } : {}),
        coverLetter: finalCoverLetter,
        aiMatchScore: matchScore,
        status: ApplicationStatus.APPLIED,
      },
      include: {
        resume: true,
      }
    });
  }

  async applyOneTap(userId: string, jobId: string, resumeId?: string) {
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

    // Ensure resume is attached
    const attachedResumeId = await this.ensureResumeForProfile(jobSeekerProfile, resumeId);

    // Fetch the resume text if attached
    let resumeText = '';
    if (attachedResumeId) {
      const resume = await this.prisma.resume.findUnique({ where: { id: attachedResumeId } });
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
        ...(attachedResumeId ? { resumeId: attachedResumeId } : {}),
        portfolioData: jobSeekerProfile.portfolio ?? Prisma.JsonNull,
        certificatesData: jobSeekerProfile.certificates ?? Prisma.JsonNull,
        coverLetter: generatedCoverLetter,
        aiMatchScore: matchScore,
        status: ApplicationStatus.APPLIED,
      },
      include: {
        resume: true,
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
          include: {
            employer: {
              select: {
                id: true,
                userId: true,
                companyName: true,
                profilePicture: true,
              },
            },
          },
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

    const applications = await this.prisma.application.findMany({
      where: { jobId },
      include: {
        jobSeekerProfile: true,
        resume: true,
      },
      orderBy: [
        { aiMatchScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return applications.map((app) => {
      if (!app.resume && app.jobSeekerProfile) {
        const p = app.jobSeekerProfile;
        const synthResume = {
          id: `profile-${p.id}`,
          jobSeekerId: p.id,
          title: `${p.firstName} ${p.lastName} - Resume`,
          summary: p.summary || p.bio || `Professional ${p.desiredJobTitle || p.profession || 'Specialist'}`,
          skills: p.skills || [],
          experience: p.experience || [],
          education: p.education || [],
          projects: p.projects || [],
          certifications: p.certificates || p.professionalCertifications || [],
          personalInfo: {
            firstName: p.firstName,
            lastName: p.lastName,
            phone: p.phone,
            city: p.residenceCity || p.residenceCountry,
          },
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        };
        return { ...app, resume: synthResume };
      }
      return app;
    });
  }

  async getApplicationById(userId: string, applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobSeekerProfile: true,
        resume: true,
        job: {
          include: { employer: true }
        }
      }
    });

    if (!application) throw new NotFoundException('Application not found');

    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    const seeker = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });

    const isEmployerOwner = employer && application.job.employerId === employer.id;
    const isSeekerOwner = seeker && application.jobSeekerId === seeker.id;

    if (!isEmployerOwner && !isSeekerOwner) {
      throw new ForbiddenException('You do not have permission to view this application.');
    }

    if (!application.resume && application.jobSeekerProfile) {
      const p = application.jobSeekerProfile;
      const synthResume = {
        id: `profile-${p.id}`,
        jobSeekerId: p.id,
        title: `${p.firstName} ${p.lastName} - Resume`,
        summary: p.summary || p.bio || `Professional ${p.desiredJobTitle || p.profession || 'Specialist'}`,
        skills: p.skills || [],
        experience: p.experience || [],
        education: p.education || [],
        projects: p.projects || [],
        certifications: p.certificates || p.professionalCertifications || [],
        personalInfo: {
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          city: p.residenceCity || p.residenceCountry,
        },
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      };
      return { ...application, resume: synthResume };
    }

    return application;
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

    const profile = await this.prisma.jobSeekerProfile.findUnique({ 
      where: { userId: jobSeekerUserId },
      include: { user: true }
    });
    if (!profile) throw new NotFoundException('Job seeker not found.');

    const existingApp = await this.prisma.application.findFirst({
      where: { jobId, jobSeekerId: profile.id }
    });

    let appResult;
    if (existingApp) {
      appResult = await this.prisma.application.update({
        where: { id: existingApp.id },
        data: { status: 'INVITED' }
      });
    } else {
      appResult = await this.prisma.application.create({
        data: {
          jobId,
          jobSeekerId: profile.id,
          status: 'INVITED'
        }
      });
    }

    if (profile.user?.email) {
      this.mailService.sendInterviewInvitation({
        to: profile.user.email,
        candidateName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        companyName: employer.companyName,
        jobTitle: job.title,
        interviewDate: new Date(),
      }).catch(err => console.error('Error sending invitation email:', err));
    }

    return appResult;
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
      include: {
        job: { include: { employer: true } },
        jobSeekerProfile: { include: { user: true } },
      },
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

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { 
        status: 'INVITED',
        interviewDate: new Date(interviewDate),
        interviewLink
      },
    });

    // Send interview email notification to the candidate
    const candidateEmail = application.jobSeekerProfile?.user?.email;
    if (candidateEmail) {
      const candidateName = `${application.jobSeekerProfile.firstName || ''} ${application.jobSeekerProfile.lastName || ''}`.trim();
      const companyName = application.job.employer?.companyName || 'Employer';
      this.mailService.sendInterviewInvitation({
        to: candidateEmail,
        candidateName,
        companyName,
        jobTitle: application.job.title,
        interviewDate,
        interviewLink,
      }).catch(err => console.error('Error sending interview email:', err));
    }

    return updated;
  }
}
