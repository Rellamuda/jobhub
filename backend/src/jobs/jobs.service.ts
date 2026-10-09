import { Injectable, NotFoundException, ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AutonomousService } from './autonomous.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private autonomousService: AutonomousService
  ) {}

  async createJob(userId: string, data: Prisma.JobCreateWithoutEmployerInput) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
    });

    if (!employer) {
      throw new ForbiddenException('You must create an employer profile before posting a job.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.subscriptionTier === 'FREE') {
      const jobCount = await this.prisma.job.count({ where: { employerId: employer.id } });
      if (jobCount >= 3) {
        throw new ForbiddenException('Free tier is limited to 3 job postings. Please upgrade your subscription.');
      }
    }

    const newJob = await this.prisma.job.create({
      data: {
        ...data,
        employer: { connect: { id: employer.id } },
      },
    });

    // Run AI checks and autonomous applications asynchronously
    this.generateSmartAlerts(newJob).catch(console.error);
    this.runFraudCheck(newJob).catch(console.error);
    this.autonomousService.autoApplyJobForMatchingSeekers(newJob).catch(console.error);

    return newJob;
  }

  async createJobsBulk(userId: string, jobsData: Prisma.JobCreateWithoutEmployerInput[]) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
    });

    if (!employer) {
      throw new ForbiddenException('You must create an employer profile before posting jobs.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isFree = user?.subscriptionTier === 'FREE';

    let currentJobCount = await this.prisma.job.count({ where: { employerId: employer.id } });
    const createdJobs: any[] = [];
    const errors: string[] = [];

    for (const data of jobsData) {
      if (isFree && currentJobCount >= 3) {
        errors.push(`Free tier limit reached (max 3 jobs). Created ${createdJobs.length} jobs. Upgrade for unlimited posting.`);
        break;
      }

      if (!data.title || !data.title.trim()) {
        continue;
      }

      const newJob = await this.prisma.job.create({
        data: {
          ...data,
          employer: { connect: { id: employer.id } },
        },
      });

      currentJobCount++;
      createdJobs.push(newJob);

      this.generateSmartAlerts(newJob).catch(console.error);
      this.runFraudCheck(newJob).catch(console.error);
      this.autonomousService.autoApplyJobForMatchingSeekers(newJob).catch(console.error);
    }

    return {
      success: true,
      count: createdJobs.length,
      jobs: createdJobs,
      message: `Successfully posted ${createdJobs.length} job vacancy roles!`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async runFraudCheck(job: any) {
    // In real app, call AI service
    const text = job.title + ' ' + job.description;
    let score = 10;
    if (text.toLowerCase().includes('scam')) score = 90;

    if (score > 80) {
      await this.prisma.job.update({
        where: { id: job.id },
        data: { isFlagged: true, fraudScore: score, flagReason: 'High probability of spam' }
      });
    }
  }

  private async generateSmartAlerts(job: any) {
    // Basic logic to find profiles matching the job
    const jobText = (job.title + ' ' + job.description).toLowerCase();
    const jobWords = jobText.split(/[^a-z0-9]/).filter(w => w.length > 3);

    const profiles = await this.prisma.jobSeekerProfile.findMany({
      include: { user: true }
    });

    for (const profile of profiles) {
      const profileText = [
        profile.profession,
        profile.skilledProfession,
        profile.headline,
        profile.summary,
        ...profile.skills
      ].filter(Boolean).join(' ').toLowerCase();

      let score = 0;
      for (const word of jobWords) {
        if (profileText.includes(word)) score++;
      }

      // Calculate a faux probability based on score matching
      const matchProbability = Math.min(99, 50 + (score * 5));
      
      if (matchProbability >= 85) { // Only high chance
        await this.prisma.notification.create({
          data: {
            userId: profile.user.id,
            jobId: job.id,
            matchProbability,
            message: `Smart Alert: You have a ${matchProbability}% chance of shortlisting for ${job.title} at ${job.employerId}` // In real app, fetch company name
          }
        });
      }
    }
  }

  async findFeed(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    let jobs = await this.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employer: {
          select: { companyName: true, website: true, profilePicture: true, verificationStatus: true, businessType: true },
        },
      },
    });

    if (user.role === 'JOB_SEEKER') {
      const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId } });
      if (profile) {
        // Stop words to prevent false positives like 'team', 'work', 'years'
        const stopWords = new Set([
          'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
          'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
          'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
          'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'if', 'in',
          'into', 'is', 'it', 'its', 'just', 'me', 'more', 'most', 'my', 'no', 'nor', 'not', 'of', 'off',
          'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
          'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
          'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
          'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
          'work', 'working', 'team', 'company', 'role', 'year', 'years', 'experience', 'candidate',
          'looking', 'join', 'help', 'able', 'good', 'strong', 'well', 'responsible', 'skills', 'skill'
        ]);

        const experienceArray = profile.experience as any[] || [];
        const experienceRoles = experienceArray.map(e => e.role || '').filter(Boolean);

        const primaryTerms = [
          profile.desiredJobTitle,
          profile.profession,
          profile.skilledProfession,
          profile.headline,
          ...experienceRoles,
          ...(profile.skills || []),
          ...(profile.autoApplyKeywords || [])
        ].filter(Boolean)
         .map(t => t.toLowerCase().trim())
         .filter(t => !stopWords.has(t) && t.length > 2);

        const prefLocations = (typeof profile.preferredLocations === 'string' ? profile.preferredLocations : (Array.isArray(profile.preferredLocations) ? profile.preferredLocations.join(' ') : '')).toLowerCase();
        const prefersAnyCountry = prefLocations.includes('any country') || prefLocations.includes('any') || profile.willingToRelocate;
        const seekerCountry = (profile.residenceCountry || '').toLowerCase();
        const seekerCity = (profile.residenceCity || '').toLowerCase();

        jobs = jobs.map(job => {
          const jobTitleLower = (job.title || '').toLowerCase();
          const jobDescLower = (job.description || '').toLowerCase();
          const jobLocationLower = (job.location || '').toLowerCase();
          const isJobRemote = !!job.isRemote || jobLocationLower.includes('remote');

          let directTitleMatch = false;
          let matchedSkillCount = 0;

          for (const term of primaryTerms) {
            if (jobTitleLower.includes(term)) {
              directTitleMatch = true;
              matchedSkillCount += 3;
            } else if (jobDescLower.includes(term)) {
              matchedSkillCount += 1;
            }
          }

          // Location compatibility
          const locationOk = isJobRemote || prefersAnyCountry || !jobLocationLower ||
            (seekerCountry && jobLocationLower.includes(seekerCountry)) ||
            (seekerCity && jobLocationLower.includes(seekerCity));

          // Calculate authentic percentage match
          let calculatedPercent = 0;
          if (directTitleMatch) {
            calculatedPercent = Math.min(98, 76 + (matchedSkillCount * 4) + (locationOk ? 6 : 0));
          } else if (matchedSkillCount >= 2) {
            calculatedPercent = Math.min(88, 54 + (matchedSkillCount * 5) + (locationOk ? 6 : 0));
          } else if (matchedSkillCount === 1 && locationOk) {
            calculatedPercent = 50;
          }

          return {
            ...job,
            matchScore: calculatedPercent,
          };
        })
        .filter(job => (job as any).matchScore >= 50) // ONLY return jobs that truly match candidate's profile
        .sort((a, b) => (b as any).matchScore - (a as any).matchScore);
      }

      if (user.subscriptionTier === 'FREE') {
        jobs = jobs.slice(0, 3);
      }
    }

    return jobs;
  }

  async findMarketplace(userId: string) {
    const marketplaceTypes = ['FREELANCE', 'CONTRACT', 'GIG', 'HOURLY'];
    
    let jobs = await this.prisma.job.findMany({
      where: {
        employmentType: {
          in: marketplaceTypes
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        employer: { select: { companyName: true, website: true, profilePicture: true, verificationStatus: true, businessType: true } }
      }
    });

    return jobs;
  }

  async findInternships(userId: string) {
    const internshipTypes = ['INTERNSHIP', 'GRADUATE', 'NYSC', 'APPRENTICESHIP'];
    
    let jobs = await this.prisma.job.findMany({
      where: {
        employmentType: {
          in: internshipTypes
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        employer: { select: { companyName: true, website: true, profilePicture: true, verificationStatus: true, businessType: true } }
      }
    });

    return jobs;
  }

  async findEmployerJobs(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
    });
    
    if (!employer) {
      throw new ForbiddenException('No employer profile found.');
    }

    return this.prisma.job.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true }
        },
        applications: {
          include: {
            jobSeekerProfile: true
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: { companyName: true, website: true, description: true, profilePicture: true, verificationStatus: true, businessType: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found.');
    }

    return job;
  }

  async findMatchesForJob(userId: string, jobId: string) {
    const employer = await this.prisma.employer.findUnique({ 
      where: { userId },
      include: { user: true }
    });
    if (!employer) throw new ForbiddenException('No employer profile found.');

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employer.id) {
      throw new ForbiddenException('You do not own this job posting.');
    }

    const stopWords = new Set([
      'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
      'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
      'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
      'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'if', 'in',
      'into', 'is', 'it', 'its', 'just', 'me', 'more', 'most', 'my', 'no', 'nor', 'not', 'of', 'off',
      'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
      'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
      'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
      'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
      'work', 'working', 'team', 'company', 'role', 'year', 'years', 'experience', 'candidate',
      'looking', 'join', 'help', 'able', 'good', 'strong', 'well', 'responsible', 'skills', 'skill',
      'must', 'will', 'also', 'part', 'time', 'full', 'great', 'high', 'need', 'needs', 'plus',
      'applicant', 'requirements', 'duties', 'responsibilities', 'opportunity'
    ]);

    const jobTitleLower = (job.title || '').toLowerCase().trim();
    const jobTitleKeywords = jobTitleLower
      .split(/[^a-z0-9]/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    const jobDescLower = (job.description || '').toLowerCase();
    const jobLocationLower = (job.location || '').toLowerCase();
    const isJobRemote = !!job.isRemote || jobLocationLower.includes('remote');

    let scored = profiles.map(profile => {
      const experienceArray = (profile.experience as any[]) || [];
      const experienceRoles = experienceArray.map(e => (e.role || '').toLowerCase()).filter(Boolean);
      
      const candidateTitles = [
        profile.desiredJobTitle,
        profile.profession,
        profile.skilledProfession,
        profile.headline,
        ...experienceRoles,
      ].filter(Boolean).map(t => t.toLowerCase().trim());

      const candidateSkills = (profile.skills || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean);

      // 1. Direct Title / Profession Matching (0 to 45 pts)
      let titleScore = 0;
      let hasRoleMatch = false;

      for (const cTitle of candidateTitles) {
        if (!cTitle) continue;
        if (jobTitleLower.includes(cTitle) || cTitle.includes(jobTitleLower)) {
          titleScore = 45;
          hasRoleMatch = true;
          break;
        }
        const cKeywords = cTitle.split(/[^a-z0-9]/).filter(w => w.length > 2 && !stopWords.has(w));
        const matchingKeywords = jobTitleKeywords.filter(k => cKeywords.includes(k));
        if (matchingKeywords.length >= 2) {
          titleScore = Math.max(titleScore, 38);
          hasRoleMatch = true;
        } else if (matchingKeywords.length === 1 && jobTitleKeywords.length <= 2) {
          titleScore = Math.max(titleScore, 28);
          hasRoleMatch = true;
        }
      }

      // 2. Skill Overlap Matching (0 to 40 pts)
      let matchedSkillCount = 0;
      for (const skill of candidateSkills) {
        if (skill.length <= 2 || stopWords.has(skill)) continue;
        if (jobTitleLower.includes(skill)) {
          matchedSkillCount += 2;
        } else if (jobDescLower.includes(skill)) {
          matchedSkillCount += 1;
        }
      }
      const skillScore = Math.min(40, matchedSkillCount * 10);

      // 3. Location / Work Preference Match (0 to 15 pts)
      let locationScore = 0;
      const prefCountry = (typeof profile.preferredLocations === 'string' ? profile.preferredLocations : '').toLowerCase();
      const resCountry = (profile.residenceCountry || '').toLowerCase();
      const resCity = (profile.residenceCity || '').toLowerCase();

      if (isJobRemote || profile.willingToRelocate || prefCountry === 'any country' || prefCountry.includes('any')) {
        locationScore = 15;
      } else if (jobLocationLower && (
        (resCountry && jobLocationLower.includes(resCountry)) ||
        (resCity && jobLocationLower.includes(resCity)) ||
        (prefCountry && jobLocationLower.includes(prefCountry))
      )) {
        locationScore = 15;
      } else if (!jobLocationLower) {
        locationScore = 10;
      }

      const totalScore = titleScore + skillScore + locationScore;
      const isGenuineMatch = (hasRoleMatch && (skillScore > 0 || totalScore >= 50)) || (matchedSkillCount >= 2);

      return {
        ...profile,
        matchScore: isGenuineMatch ? Math.min(99, Math.max(50, totalScore)) : 0,
      };
    })
    .filter(p => p.matchScore >= 55) // Only genuinely matching candidates!
    .sort((a, b) => b.matchScore - a.matchScore);

    // Apply Employer Monetization Limits:
    // Free: 3 candidate matches
    // Premium: up to 50 candidate matches
    // Silver (Enterprise): Unlimited matches
    const tier = employer.user?.subscriptionTier || 'FREE';
    if (tier === 'FREE') {
      scored = scored.slice(0, 3);
    } else if (tier === 'PREMIUM') {
      scored = scored.slice(0, 50);
    }

    return scored;
  }

  async referCandidate(referrerId: string, jobId: string, candidateEmail: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const candidateUser = await this.prisma.user.findUnique({ where: { email: candidateEmail }, include: { jobSeekerProfile: true } });
    if (!candidateUser || !candidateUser.jobSeekerProfile) throw new NotFoundException('Candidate profile not found');

    const existingReferral = await this.prisma.referral.findFirst({
      where: { jobId, candidateId: candidateUser.jobSeekerProfile.id }
    });

    if (existingReferral) throw new ForbiddenException('Candidate has already been referred for this job');

    return this.prisma.referral.create({
      data: {
        referrerId,
        candidateId: candidateUser.jobSeekerProfile.id,
        jobId,
        status: 'PENDING',
        rewardAmount: 50 // e.g. $50 or 50 points
      }
    });
  }
}
