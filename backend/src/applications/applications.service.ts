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

  private async sendApplicationAcknowledgement(
    userId: string,
    candidateEmail: string | undefined,
    candidateName: string,
    job: any,
    hasResume: boolean,
    hasCoverLetter: boolean,
    matchScore: number
  ) {
    const companyName = job.employer?.companyName || 'Employer';
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          jobId: job.id,
          matchProbability: Math.round(matchScore || 90),
          message: `📬 Application Acknowledged: Your application for "${job.title}" at "${companyName}" has been received. Your resume has been submitted to the employer for review, and feedback will be sent to you as soon as they review it.`,
        },
      });
    } catch (err) {
      console.error('Error creating acknowledgement notification:', err);
    }

    if (job.employer?.userId) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: job.employer.userId,
            jobId: job.id,
            matchProbability: Math.round(matchScore || 90),
            message: `📥 New Application: ${candidateName || 'A candidate'} applied for "${job.title}" (${Math.round(matchScore || 85)}% AI Match).`,
          },
        });
      } catch (err) {
        console.error('Error creating employer application notification:', err);
      }
    }

    if (candidateEmail) {
      this.mailService.sendApplicationAcknowledgement({
        to: candidateEmail,
        candidateName,
        companyName,
        jobTitle: job.title,
        hasResume,
        hasCoverLetter,
      }).catch(err => console.error('Error sending acknowledgement email:', err));
    }
  }

  async applyToJob(userId: string, jobId: string, coverLetter?: string, resumeId?: string) {
    const jobSeekerProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!jobSeekerProfile) {
      throw new ForbiddenException('You must create a Job Seeker profile before applying.');
    }

    const job = await this.prisma.job.findUnique({ 
      where: { id: jobId },
      include: { employer: true },
    });
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

    const application = await this.prisma.application.create({
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

    // Send immediate autonomous acknowledgement to job seeker
    const candidateName = `${jobSeekerProfile.firstName || ''} ${jobSeekerProfile.lastName || ''}`.trim();
    this.sendApplicationAcknowledgement(
      userId,
      jobSeekerProfile.user?.email,
      candidateName,
      job,
      !!attachedResumeId,
      !!finalCoverLetter,
      matchScore
    );

    return application;
  }

  async applyOneTap(userId: string, jobId: string, resumeId?: string) {
    const jobSeekerProfile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!jobSeekerProfile) throw new ForbiddenException('Profile not found.');

    const job = await this.prisma.job.findUnique({ 
      where: { id: jobId },
      include: { employer: true },
    });
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

    const application = await this.prisma.application.create({
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

    // Send immediate autonomous acknowledgement to job seeker
    const candidateName = `${jobSeekerProfile.firstName || ''} ${jobSeekerProfile.lastName || ''}`.trim();
    this.sendApplicationAcknowledgement(
      userId,
      jobSeekerProfile.user?.email,
      candidateName,
      job,
      !!attachedResumeId,
      !!generatedCoverLetter,
      matchScore
    );

    return application;
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
      include: { job: { include: { employer: true } }, jobSeekerProfile: true },
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
      data: { status },
    });

    if (application.jobSeekerProfile?.userId) {
      try {
        const companyName = employer?.companyName || 'The employer';
        await this.prisma.notification.create({
          data: {
            userId: application.jobSeekerProfile.userId,
            jobId: application.jobId,
            matchProbability: Math.round(application.aiMatchScore || 90),
            message: `🔔 Application Update: ${companyName} updated your application status for "${application.job.title}" to ${status}.`,
          },
        });
      } catch (err) {
        console.error('Error creating status update notification:', err);
      }
    }

    return updated;
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

    const candidateName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidate';

    // Create an initial conversation message and notification for the candidate
    try {
      await this.prisma.message.create({
        data: {
          senderId: employerUserId,
          receiverId: jobSeekerUserId,
          content: `🎉 Hello ${candidateName}! You have been invited by ${employer.companyName} to interview for the "${job.title}" position. Please reply here or accept the invitation from your Applications dashboard.`,
        },
      });
      await this.prisma.notification.create({
        data: {
          userId: jobSeekerUserId,
          jobId: job.id,
          matchProbability: 95,
          message: `🎉 Interview Invitation: ${employer.companyName} invited you to interview for "${job.title}". Check your Applications or Messages to respond!`,
        },
      });
    } catch (err) {
      console.error('Error creating invitation message/notification:', err);
    }

    if (profile.user?.email) {
      this.mailService.sendInterviewInvitation({
        to: profile.user.email,
        candidateName,
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

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { include: { employer: true } },
      },
    });
    if (!application || application.jobSeekerId !== profile.id) {
      throw new ForbiddenException('Not your application');
    }

    // Only allow specific transitions like accepting or declining offers/invitations
    if (!['ACCEPTED_OFFER', 'DECLINED_OFFER'].includes(status)) {
      throw new ForbiddenException('Invalid status update for job seeker');
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status }
    });

    const employerUserId = application.job?.employer?.userId;
    const candidateName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'A candidate';
    const jobTitle = application.job?.title || 'your job opening';
    const isAccepted = status === 'ACCEPTED_OFFER';

    if (employerUserId) {
      const responseText = isAccepted
        ? `✅ Hello! I (${candidateName}) have ACCEPTED your interview invitation for "${jobTitle}". I look forward to speaking with you!`
        : `Hello, thank you for inviting me (${candidateName}) to interview for "${jobTitle}". Unfortunately, I must respectfully decline the invitation at this time.`;

      try {
        await this.prisma.message.create({
          data: {
            senderId: jobSeekerUserId,
            receiverId: employerUserId,
            content: responseText,
          },
        });

        await this.prisma.notification.create({
          data: {
            userId: employerUserId,
            jobId: application.jobId,
            matchProbability: Math.round(application.aiMatchScore || 95),
            message: isAccepted
              ? `✅ Invitation Accepted: ${candidateName} accepted your interview invitation for "${jobTitle}" and sent you a message!`
              : `ℹ️ Invitation Declined: ${candidateName} declined the interview invitation for "${jobTitle}".`,
          },
        });
      } catch (err) {
        console.error('Error sending seeker response message/notification to employer:', err);
      }
    }

    return updated;
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

    const candidateUserId = application.jobSeekerProfile?.userId;
    const candidateName = `${application.jobSeekerProfile?.firstName || ''} ${application.jobSeekerProfile?.lastName || ''}`.trim() || 'Candidate';
    const companyName = application.job.employer?.companyName || 'Employer';
    const formattedDate = new Date(interviewDate).toLocaleString();

    if (candidateUserId) {
      try {
        await this.prisma.message.create({
          data: {
            senderId: employerUserId,
            receiverId: candidateUserId,
            content: `📅 Interview Scheduled by ${companyName} for "${application.job.title}" on ${formattedDate}.${interviewLink ? ` Meeting Link: ${interviewLink}` : ''} Please reply here or accept the invitation in your Applications tab.`,
          },
        });

        await this.prisma.notification.create({
          data: {
            userId: candidateUserId,
            jobId: application.jobId,
            matchProbability: Math.round(application.aiMatchScore || 95),
            message: `📅 Interview Scheduled: ${companyName} invited you to an interview for "${application.job.title}" on ${formattedDate}.`,
          },
        });
      } catch (err) {
        console.error('Error creating scheduleInterview message/notification:', err);
      }
    }

    // Send interview email notification to the candidate
    const candidateEmail = application.jobSeekerProfile?.user?.email;
    if (candidateEmail) {
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
