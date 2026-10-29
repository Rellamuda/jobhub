import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly fastApiUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000/ai';

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Sanitizes string inputs to prevent prompt inflation / token-waste attacks
   */
  private sanitizeString(val: any, maxChars = 2500): string {
    if (!val) return '';
    const str = typeof val === 'string' ? val : JSON.stringify(val);
    return str.length > maxChars ? str.substring(0, maxChars) + '...' : str;
  }

  private sanitizeProfile(profile: any): any {
    if (!profile || typeof profile !== 'object') return {};
    return {
      ...profile,
      summary: this.sanitizeString(profile.summary || profile.bio, 2500),
      headline: this.sanitizeString(profile.headline, 200),
      profession: this.sanitizeString(profile.profession, 150),
      skills: Array.isArray(profile.skills)
        ? profile.skills.slice(0, 30).map((s: any) => this.sanitizeString(s, 60))
        : [],
      experience: Array.isArray(profile.experience)
        ? profile.experience.slice(0, 10).map((e: any) => ({
            ...e,
            responsibilities: this.sanitizeString(e.responsibilities || e.description, 1000),
            role: this.sanitizeString(e.role || e.title, 150),
            company: this.sanitizeString(e.company, 150),
          }))
        : [],
      education: Array.isArray(profile.education) ? profile.education.slice(0, 6) : [],
    };
  }

  private sanitizeJob(job: any): any {
    if (!job || typeof job !== 'object') return {};
    return {
      ...job,
      title: this.sanitizeString(job.title, 200),
      description: this.sanitizeString(job.description, 3500),
      requirements: this.sanitizeString(job.requirements, 2000),
      companyName: this.sanitizeString(job.companyName || job.company, 200),
    };
  }

  async generateResume(profileData: any): Promise<any> {
    const cleanProfile = this.sanitizeProfile(profileData);
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/resume/generate`, cleanProfile),
      );
      return response.data;
    } catch (error) {
      const fName = profileData?.firstName || profileData?.first_name || 'Valued';
      const lName = profileData?.lastName || profileData?.last_name || 'Candidate';
      const prof = profileData?.desiredJobTitle || profileData?.profession || 'Professional';
      const skills = Array.isArray(profileData?.skills) ? profileData.skills : ['Project Management', 'Strategic Execution', 'Leadership'];
      return {
        resume: `# RESUME\n\n## ${fName} ${lName}\n**RESUME — ${prof}**\n\n### Executive Summary\nAccomplished, results-oriented ${prof} with demonstrated excellence in ${skills.slice(0, 3).join(', ')}. Recognized for architecting scalable solutions, improving operational workflows, and driving team success.\n`,
        structured: {
          title: `RESUME — ${fName} ${lName}`,
          personalInfo: {
            firstName: fName,
            lastName: lName,
            email: profileData?.email || 'talent@jobhub.ai',
            phone: profileData?.phone || '+1 (555) 019-2834',
            city: profileData?.city || profileData?.residenceCity || 'Remote / Flexible'
          },
          summary: profileData?.summary || `Accomplished ${prof} with proven expertise in ${skills.join(', ')}. Demonstrated success driving cross-functional outcomes and executing high-impact initiatives.`,
          skills: skills,
          experience: Array.isArray(profileData?.experience) && profileData.experience.length > 0 ? profileData.experience : [
            {
              role: `Lead ${prof}`,
              company: "Apex Global Solutions",
              dates: "2022 - Present",
              responsibilities: `• Spearheaded core initiatives leveraging ${skills.slice(0, 2).join(' & ')}, improving operational throughput by 30%.\n• Collaborated cross-functionally to streamline delivery cycles and ensure top-tier execution.`
            }
          ],
          education: Array.isArray(profileData?.education) && profileData.education.length > 0 ? profileData.education : [
            {
              course: `Degree in ${prof} / Information Systems`,
              school: "Accredited University",
              dates: "Graduated with Honors"
            }
          ]
        }
      };
    }
  }

  async generateCompanyProfile(companyData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/company-profile/generate`, companyData),
      );
      return response.data;
    } catch (error) {
      const name = (companyData?.companyName || companyData?.company_name || 'Enterprise Innovations').trim();
      const industry = (companyData?.industry || 'Technology & Business Services').trim();
      const bizType = (companyData?.businessType || companyData?.business_type || 'Company').trim();
      const city = (companyData?.locationCity || companyData?.city || 'Global Hub').trim();
      const country = (companyData?.locationCountry || companyData?.country || 'International').trim();
      const isAgency = bizType.toLowerCase().includes('agency') || industry.toLowerCase().includes('recruitment') || industry.toLowerCase().includes('staffing') || name.toLowerCase().includes('agency');

      if (isAgency) {
        return {
          companyName: name,
          industry,
          businessType: 'Agency / Recruitment Agency',
          locationCity: city,
          locationCountry: country,
          description: `${name} is a premier talent solutions agency and recruitment consultancy specializing in ${industry}. Headquartered in ${city}, ${country}, we connect forward-looking organizations with world-class vetted professionals. Leveraging predictive AI matching and tailored recruiting workflows, we deliver rapid talent placement and sustained organizational success.`,
          mission: `To connect high-caliber talent with mission-driven employers through transparent, merit-based, and human-centric recruitment solutions.`,
          vision: `To be the most trusted global talent advisory partner, recognized for exceptional candidate outcomes and client impact.`,
          coreValues: [
            { title: 'Candidate Advocacy', description: 'Empowering job seekers with transparency, high-growth placements, and dedicated career guidance.' },
            { title: 'Precision Matching', description: 'Using specialized industry insights and AI screening to match the right candidates with the right roles.' },
            { title: 'Integrity & Trust', description: 'Upholding strict confidentiality and ethical standards in all staffing engagements.' },
            { title: 'Agile Partnership', description: 'Acting as an adaptive extension of hiring teams to fulfill urgent talent requirements.' }
          ],
          culture: `At ${name}, we celebrate teamwork, speed, and genuine empathy. We promote high performance in a supportive atmosphere where every recruiter and client manager is equipped to succeed.`,
          whyWorkWithUs: `Joining ${name} means working in an agile, meritocratic environment with industry-leading placement technology, uncapped performance incentives, and clear leadership pathways.`,
          benefits: [
            'Competitive Base Compensation & Uncapped Commissions',
            'Comprehensive Medical, Dental, and Vision Coverage',
            'Flexible Hybrid & Remote Work Policies',
            'Annual Professional Development & Recruitment Licensing Stipend',
            'Generous Paid Time Off and Company Holidays'
          ]
        };
      }

      return {
        companyName: name,
        industry,
        businessType: bizType,
        locationCity: city,
        locationCountry: country,
        description: `${name} is an industry-leading organization specializing in ${industry}. Based in ${city}, ${country}, we build forward-thinking solutions and deliver measurable value to clients worldwide. Our mission-driven teams innovate continually to solve complex operational challenges and deliver transformative impact.`,
        mission: `To pioneer innovative products and services in ${industry} that elevate our clients' capabilities and set new benchmarks for excellence.`,
        vision: `To lead global innovation in ${industry}, recognized for sustainable growth, ethical operations, and empowering workplace culture.`,
        coreValues: [
          { title: 'Customer Obsession', description: 'Designing solutions that solve real challenges and delight our users at every interaction.' },
          { title: 'Continuous Innovation', description: 'Fostering calculated risk-taking, technological adoption, and creative problem solving.' },
          { title: 'Accountability & Integrity', description: 'Taking ownership of results and communicating with uncompromised honesty.' },
          { title: 'Collaborative Excellence', description: 'Thriving through teamwork, mutual respect, and inclusive perspectives.' }
        ],
        culture: `We foster a vibrant culture built on mutual trust, continuous learning, and open communication. Team members are given the autonomy to take initiative and build meaningful solutions.`,
        whyWorkWithUs: `At ${name}, you will work on challenging, impactful projects alongside top-tier talent. We invest heavily in our team members' personal and professional development while fostering work-life harmony.`,
        benefits: [
          'Top-Tier Competitive Compensation & Performance Bonuses',
          'Comprehensive Health, Dental, and Mental Wellbeing Benefits',
          'Flexible Work Hours and Remote Flexibility',
          'Annual Learning & Conference Attendance Budget',
          'Generous Paid Time Off and Parental Leave Programs'
        ]
      };
    }
  }

  async generateCoverLetter(profileData: any, jobData: any): Promise<string> {
    const cleanProfile = this.sanitizeProfile(profileData);
    const cleanJob = this.sanitizeJob(jobData);
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/cover-letter/generate`, {
          profile: cleanProfile,
          job: cleanJob,
        }),
      );
      return response.data.cover_letter;
    } catch (error) {
      const fName = profileData?.firstName || profileData?.first_name || 'Valued';
      const lName = profileData?.lastName || profileData?.last_name || 'Candidate';
      const name = `${fName} ${lName}`.trim();
      const comp = jobData?.companyName || jobData?.company || 'Hiring Team';
      const role = jobData?.title || 'Target Position';
      return `Dear Hiring Team at ${comp},\n\nI am writing to express my strong enthusiasm for the ${role} position. With a solid foundation in modern methodologies, collaborative execution, and delivering measurable results, I am eager to contribute immediately to ${comp}'s objectives.\n\nThank you for your consideration, and I look forward to the opportunity to connect.\n\nSincerely,\n\n${name}\nApplicant via JobHub AI Ecosystem`;
    }
  }

  async calculateMatchScore(profileText: string, jobText: string): Promise<number> {
    const cleanProfile = this.sanitizeString(profileText, 3500);
    const cleanJob = this.sanitizeString(jobText, 3500);
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/match/score`, {
          profile_text: cleanProfile,
          job_description_text: cleanJob,
        }),
      );
      if (response?.data?.match_score !== undefined) {
        return response.data.match_score;
      }
    } catch (error) {
      // Fallback algorithmic scoring if Python service is busy or offline
    }

    // Tokenized fallback score
    const pTokens = (profileText || '').toLowerCase().match(/[a-z0-9+#]{3,}/g) || [];
    const jTokens = (jobText || '').toLowerCase().match(/[a-z0-9+#]{3,}/g) || [];
    const pSet = new Set(pTokens);
    const jSet = new Set(jTokens);

    let common = 0;
    for (const t of jSet) {
      if (pSet.has(t)) common++;
    }

    const overlap = common / Math.max(jSet.size, 1);
    const score = Math.min(97.5, Math.max(25.0, 35.0 + (overlap * 60.0)));
    return Math.round(score * 10) / 10;
  }

  async getProfileScore(profileData: any): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/profile/score`, profileData));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to score profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSkillGap(profileData: any, jobData: any): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/skills/gap`, { profile: profileData, job: jobData }));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to analyze skill gap', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSalaryEstimate(jobTitle: string, location: string, exp: number): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/salary/estimate`, { job_title: jobTitle, location, experience_years: exp }));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to estimate salary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCareerSuggestions(profileData: any): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/career/suggestions`, profileData));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to get career suggestions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getInterviewQuestions(jobData: any, profileData: any): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/interview/questions`, { job: jobData, profile: profileData }));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to generate interview questions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateJobDescription(jobData: any): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/job-description/generate`, jobData));
      return response.data;
    } catch (error) {
      // Coherent, role-aware fallback if Python AI service is busy or offline
      const title = (jobData?.title || jobData?.prompt || 'Open Position').trim();
      const t = title.toLowerCase();

      let overview = `We are seeking a proactive and skilled ${title} to join our team. In this position, you will be responsible for executing essential operational duties, maintaining high standards of quality, and contributing to overall team success.`;
      let responsibilities = [
        `Coordinate and execute day-to-day duties associated with the role of ${title}.`,
        'Collaborate productively with team members and cross-functional colleagues.',
        'Maintain high standards of accuracy, organization, and timely completion of assignments.',
        'Identify workflow improvements and proactively resolve operational challenges.',
        'Ensure adherence to organizational guidelines, industry standards, and workplace safety protocols.'
      ];
      let skills = [
        'Strong work ethic, reliability, and personal accountability',
        'Effective verbal and written communication skills',
        'Organized approach to task prioritization and problem solving',
        'Ability to work collaboratively in a fast-paced environment'
      ];
      let qualifications = [
        `Relevant experience or educational background suitable for a ${title}`,
        'Strong commitment to professional growth and team excellence'
      ];

      if (['clean', 'housekeep', 'janitor', 'maid', 'sanitat', 'custodian', 'laundry', 'sweeper'].some(k => t.includes(k))) {
        overview = `We are seeking a dedicated and thorough ${title} to ensure high standards of cleanliness, hygiene, and organization across our facilities. In this role, you will maintain a clean, comfortable, and safe environment for staff, clients, and visitors.`;
        responsibilities = [
          'Perform comprehensive cleaning, sweeping, vacuuming, and mopping of all designated areas and floors.',
          'Sanitize restrooms, washrooms, breakrooms, and high-touch surface points with approved disinfectants.',
          'Empty trash receptacles, dispose of waste responsibly, and replace bin liners regularly.',
          'Monitor and replenish cleaning supplies, paper products, and hygiene dispensers.',
          'Operate cleaning equipment safely and maintain all tools in good working order.',
          'Promptly report any safety hazards, needed repairs, or facility maintenance issues.'
        ];
        skills = [
          'Strong attention to detail and high standards of cleanliness',
          'Knowledge of sanitization and hygiene safety practices',
          'Physical stamina and ability to lift or operate cleaning tools',
          'Dependable time management and ability to work independently'
        ];
        qualifications = [
          'Prior experience in residential, commercial, or industrial cleaning is an advantage',
          'Commitment to punctuality, reliability, and workplace safety'
        ];
      } else if (['driver', 'chauffeur', 'delivery', 'courier', 'dispatch', 'truck', 'forklift', 'rider', 'van'].some(k => t.includes(k))) {
        overview = `We are looking for a reliable and safety-focused ${title} to handle transportation and delivery operations. You will ensure passengers, packages, or goods arrive at their destinations safely, securely, and on schedule.`;
        responsibilities = [
          'Operate assigned company vehicles safely and in strict compliance with all traffic laws and transport regulations.',
          'Plan optimal travel and delivery routes utilizing GPS navigation to avoid heavy traffic and delays.',
          'Conduct routine pre-trip and post-trip vehicle safety inspections (fluids, tire pressure, brakes).',
          'Safely load, secure, transport, and unload cargo, parcels, or passenger luggage.',
          'Maintain accurate trip logs, delivery receipts, and vehicle mileage records.',
          'Deliver polite, professional, and respectful customer service at all times.'
        ];
        skills = [
          'Defensive driving expertise and clean driving record',
          'GPS navigation and route planning proficiency',
          'Dependable time management and punctuality',
          'Physical capability to load and unload goods'
        ];
        qualifications = [
          "Valid appropriate driver's license with clean driving history",
          'Previous professional driving, courier, or delivery experience'
        ];
      } else if (['cook', 'chef', 'baker', 'barista', 'waiter', 'waitress', 'bartender', 'catering', 'kitchen', 'server', 'restaurant'].some(k => t.includes(k))) {
        overview = `We are seeking an enthusiastic and skilled ${title} to prepare high-quality culinary items and deliver exceptional dining service. You will uphold stringent food safety, quality, and kitchen hygiene standards.`;
        responsibilities = [
          'Prepare, season, and cook menu items according to established recipes, portion standards, and presentations.',
          'Maintain immaculate cleanliness, sanitization, and organization across all kitchen and prep stations.',
          'Inspect raw ingredients for freshness and guarantee safe temperature storage for all perishables.',
          'Coordinate smoothly with front-of-house staff to ensure prompt, accurate order delivery.',
          'Operate commercial kitchen equipment responsibly and adhere strictly to food safety regulations.'
        ];
        skills = [
          'Culinary craftsmanship or beverage preparation skills',
          'Knowledge of food safety, hygiene, and safe temperature handling',
          'Ability to thrive in a high-tempo, team-oriented kitchen',
          'Strong communication and attention to recipe precision'
        ];
        qualifications = [
          'Food handler certification or culinary training',
          'Proven cooking or hospitality experience in a restaurant or kitchen'
        ];
      } else if (['security', 'guard', 'officer', 'surveillance', 'bouncer', 'patrol'].some(k => t.includes(k))) {
        overview = `We are hiring an alert and responsible ${title} to protect our premises, personnel, and assets. You will maintain a secure environment and respond swiftly to any disruptions or emergency situations.`;
        responsibilities = [
          'Patrol facility grounds, monitor access points, and verify credentials of entering visitors.',
          'Operate surveillance cameras, alarm panels, and security monitoring equipment.',
          'Detect and de-escalate suspicious activities, security breaches, or unauthorized entry.',
          'Respond calmly and effectively to emergency alarms, safety hazards, or medical incidents.',
          'Maintain comprehensive daily activity logs and compile precise incident reports.'
        ];
        skills = [
          'Situational awareness and alert observation abilities',
          'Professional conflict resolution and verbal de-escalation skills',
          'Sound judgment and composure under high-pressure scenarios',
          'Physical fitness and stamina for standing or patrolling'
        ];
        qualifications = [
          'Security license or certification preferred',
          'Prior security, surveillance, or law enforcement experience'
        ];
      } else if (['sales', 'cashier', 'retail', 'store', 'teller'].some(k => t.includes(k))) {
        overview = `We are looking for an energetic and customer-focused ${title} to drive sales performance and create positive shopper experiences. You will assist customers, answer product queries, and process transactions.`;
        responsibilities = [
          'Greet customers warmly, understand their needs, and provide helpful product recommendations.',
          'Process customer purchases, returns, and digital transactions accurately through the POS system.',
          'Keep shelves stocked, organize merchandise displays, and assist with stock inventory audits.',
          'Handle customer inquiries, feedback, and special requests with courteous professionalism.',
          'Work collaboratively with the team to achieve daily, weekly, and monthly sales targets.'
        ];
        skills = [
          'Active listening and persuasive customer engagement',
          'Accurate cash handling and POS system operation',
          'Product knowledge and upbeat, positive attitude'
        ];
        qualifications = [
          'Previous experience in retail, sales, or customer service preferred',
          'Strong communication skills and dependable work ethic'
        ];
      }

      const combined = `${overview}\n\nKey Responsibilities:\n${responsibilities.map(r => `- ${r}`).join('\n')}\n\nRequirements & Qualifications:\n${[...skills, ...qualifications].map(s => `- ${s}`).join('\n')}`;

      return {
        title,
        description: combined,
        responsibilities,
        requiredSkills: skills,
        qualifications
      };
    }
  }

  async detectFraud(content: string): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/fraud/detect`, { content }));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to detect fraud via AI service', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async mentorChat(userId: string, message: string): Promise<any> {
    try {
      // In a real app, fetch context (e.g. CV) to send to AI
      const context = {};
      const response = await lastValueFrom(this.httpService.post(`${this.fastApiUrl}/mentor/chat`, { userId, message, context }));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to communicate with AI mentor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
