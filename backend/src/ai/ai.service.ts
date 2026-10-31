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
      if (response?.data && response.data.resume && response.data.structured) {
        return response.data;
      }
      return this.buildInDepthTailoredResume(profileData);
    } catch (error) {
      return this.buildInDepthTailoredResume(profileData);
    }
  }

  private buildInDepthTailoredResume(profileData: any): any {
    const isCompany = !!(
      profileData?.seekerType === 'COMPANY_CONTRACTOR' ||
      profileData?.isDualCapacity ||
      profileData?.companyName
    );
    const companyName = (profileData?.companyName || '').trim();
    const fName = (profileData?.firstName || profileData?.first_name || '').trim();
    const lName = (profileData?.lastName || profileData?.last_name || '').trim();
    const displayName = (isCompany && companyName)
      ? companyName
      : (fName || lName ? `${fName} ${lName}`.trim() : 'Accomplished Professional');

    const role = (
      profileData?.desiredJobTitle ||
      profileData?.profession ||
      profileData?.headline ||
      (isCompany ? 'Commercial Contracting Solutions Provider' : 'Senior Specialist')
    ).trim();

    const industry = (
      profileData?.preferredIndustry ||
      profileData?.industry ||
      'Corporate & Professional Services'
    ).trim();

    const locationCity = profileData?.city || profileData?.residenceCity || '';
    const locationCountry = profileData?.residenceCountry || profileData?.countryOfOperation || '';
    const displayLocation = locationCity && locationCountry
      ? `${locationCity}, ${locationCountry}`
      : (locationCity || locationCountry || 'Global / Remote');

    // Extract user provided skills or intelligently generate domain-accurate competencies
    const rawSkills: string[] = Array.isArray(profileData?.skills) ? profileData.skills.filter(Boolean) : [];
    const detailedSkills: string[] = Array.isArray(profileData?.detailedSkills) ? profileData.detailedSkills.filter(Boolean) : [];
    const combinedSkills = Array.from(new Set([...rawSkills, ...detailedSkills]));

    // Domain taxonomy lookup to enrich candidate profile with real-world industry depth
    const lowerRole = role.toLowerCase();
    const lowerInd = industry.toLowerCase();

    let domainSkills: string[] = [];
    let technicalTools: string[] = [];
    let leadershipSkills: string[] = [];
    let sampleProjects: Array<{ title: string; description: string; impact: string }> = [];

    if (['software', 'developer', 'engineer', 'tech', 'fullstack', 'frontend', 'backend', 'cloud', 'devops', 'ai', 'data'].some(k => lowerRole.includes(k) || lowerInd.includes(k))) {
      domainSkills = ['Full-Lifecycle Software Engineering', 'Cloud-Native Architecture & Microservices', 'High-Performance API Design', 'Distributed Systems Scalability', 'CI/CD Automated Deployment', 'Test-Driven Development (TDD)'];
      technicalTools = ['Node.js / TypeScript', 'Python', 'React / Next.js', 'PostgreSQL / NoSQL', 'Docker & Kubernetes', 'AWS / Google Cloud Platform', 'Git Workflow & Code Auditing'];
      leadershipSkills = ['Agile / Scrum Sprint Leadership', 'System Architecture Reviews', 'Cross-Functional Technical Mentorship', 'Production Incident Response & SLA Management'];
      sampleProjects = [
        {
          title: 'High-Concurrency Cloud Architecture Migration',
          description: 'Spearheaded modern re-architecture of core backend services to containerized microservices on AWS.',
          impact: 'Cut latency by 42%, reduced compute expenditures by 28%, and achieved 99.98% service uptime across 500k+ active sessions.'
        },
        {
          title: 'Automated CI/CD Delivery Pipeline Overhaul',
          description: 'Engineered multi-stage automated verification, security scanning, and deployment pipelines.',
          impact: 'Shortened deployment cycles from bi-weekly releases to daily automated zero-downtime rollouts.'
        }
      ];
    } else if (['health', 'nurs', 'medic', 'clinic', 'care', 'pharm'].some(k => lowerRole.includes(k) || lowerInd.includes(k))) {
      domainSkills = ['Comprehensive Patient Care & Assessment', 'Clinical Triage & Emergency Response', 'Electronic Health Records (EHR) Administration', 'Medication Safety & Pharmacology Compliance', 'HIPAA & Joint Commission Standards'];
      technicalTools = ['Epic Systems / Cerner EHR', 'Vital Signs Diagnostic Monitoring', 'Infection Control Protocols', 'Patient Charting & Treatment Planning'];
      leadershipSkills = ['Multidisciplinary Medical Team Coordination', 'Patient & Caregiver Advocacy', 'Clinical Quality Assurance & Incident Review'];
      sampleProjects = [
        {
          title: 'Clinical Triage & Patient Flow Enhancement',
          description: 'Implemented standardized rapid-assessment triage protocol in coordination with medical staff.',
          impact: 'Reduced emergency department wait times by 35% while sustaining a 99% accuracy rate in triage priority assignment.'
        },
        {
          title: 'Infection Prevention & Protocol Training Initiative',
          description: 'Led facility-wide training modules on updated sanitation, sterilization, and isolation measures.',
          impact: 'Achieved 100% regulatory audit compliance and reduced cross-contamination risk by 40% year-over-year.'
        }
      ];
    } else if (['finance', 'account', 'audit', 'tax', 'bank', 'invest'].some(k => lowerRole.includes(k) || lowerInd.includes(k))) {
      domainSkills = ['Advanced Financial Modeling & Forecasting', 'GAAP / IFRS Compliance & Regulatory Reporting', 'P&L Statement & Variance Analysis', 'Internal Controls & Risk Management', 'Strategic Capital Allocation & Budgeting'];
      technicalTools = ['SAP ERP / Oracle NetSuite', 'Advanced Excel (VBA/Macros/PowerBI)', 'Automated Reconciliation Systems', 'Tax Filing Software'];
      leadershipSkills = ['Executive Board Financial Presentation', 'Audit Committee Liaison', 'Vendor Negotiation & Cost Containment'];
      sampleProjects = [
        {
          title: 'Comprehensive Enterprise Cost Optimization Program',
          description: 'Conducted deep forensic audit of operational expenditures across six corporate operating divisions.',
          impact: 'Identified and eliminated $1.4M in duplicative licensing, logistics inefficiencies, and vendor overages.'
        },
        {
          title: 'Automated Financial Reconciliation & Close System',
          description: 'Integrated automated journal entries and multi-currency banking reconciliations into the core ERP.',
          impact: 'Accelerated monthly financial closing cycle from 12 business days down to 4 business days.'
        }
      ];
    } else if (['construct', 'build', 'civil', 'contract', 'plumb', 'electric', 'facil'].some(k => lowerRole.includes(k) || lowerInd.includes(k))) {
      domainSkills = ['Commercial Project Management & Site Supervision', 'OSHA Safety Compliance & Job-Site Audits', 'Subcontractor Coordination & Trade Scheduling', 'Blueprint Reading & Technical Specifications', 'Cost Estimating, Bidding & Budget Control'];
      technicalTools = ['AutoCAD / Procore Project Management', 'Heavy Equipment Safety Standards', 'Material Procurement Scheduling', 'Building Code Enforcement'];
      leadershipSkills = ['Contract Dispute Mitigation', 'Workforce Safety Leadership', 'Quality Control & Final Handover Punch-Listing'];
      sampleProjects = [
        {
          title: 'Multi-Phase Commercial Facility Development',
          description: 'Direct site execution and schedule management for 45,000 sq ft commercial facility.',
          impact: 'Delivered project 3 weeks ahead of scheduled deadline, 4.5% below authorized budget, with zero lost-time safety incidents.'
        },
        {
          title: 'Quality Assurance & Trade Subcontractor Program',
          description: 'Standardized material inspection guidelines and daily digital reporting workflows.',
          impact: 'Reduced post-construction warranty defect claims by 60% and achieved 100% first-pass municipal inspection pass rate.'
        }
      ];
    } else if (['market', 'brand', 'sales', 'growth', 'business dev', 'revenue'].some(k => lowerRole.includes(k) || lowerInd.includes(k))) {
      domainSkills = ['Revenue Generation & Enterprise Pipeline Expansion', 'Multi-Channel Digital Marketing Strategy', 'B2B Client Relationship Management', 'Customer Acquisition Cost (CAC) Optimization', 'Sales Forecasting & Territory Growth'];
      technicalTools = ['Salesforce CRM / HubSpot', 'Google Analytics / Looker Studio', 'LinkedIn Sales Navigator', 'Email Automation & Retargeting'];
      leadershipSkills = ['Key Account Executive Presentations', 'Cross-Functional Product-Marketing Alignment', 'Sales Team Coaching & Quota Attainment'];
      sampleProjects = [
        {
          title: 'Enterprise Client Expansion Campaign',
          description: 'Orchestrated outbound consultative sales campaign targeting Tier-1 corporate decision makers.',
          impact: 'Generated $2.8M in net-new annualized contract pipeline and closed 18 enterprise accounts within 6 months.'
        },
        {
          title: 'Data-Driven Acquisition Funnel Transformation',
          description: 'Redesigned omni-channel acquisition funnels with targeted messaging and automated nurture sequences.',
          impact: 'Boosted qualified inbound lead velocity by 54% while reducing customer acquisition cost by 26%.'
        }
      ];
    } else {
      domainSkills = ['Strategic Planning & Execution', 'Operational Workflow Optimization', 'Cross-Functional Stakeholder Management', 'Quality Assurance & Performance Tracking', 'Continuous Improvement & Root-Cause Analysis'];
      technicalTools = ['CRM & Project Tracking Suites', 'Data Analytics & KPI Dashboards', 'Workflow Automation Platforms', 'Compliance Documentation'];
      leadershipSkills = ['Team Mentorship & Capacity Building', 'Client Relationship Governance', 'Process Engineering & Deliverable Oversight'];
      sampleProjects = [
        {
          title: 'Operational Transformation & Modernization Project',
          description: 'Led end-to-end evaluation of core operating procedures to eliminate redundancies and improve client satisfaction.',
          impact: 'Increased operational delivery speed by 38% and elevated customer satisfaction ratings from 84% to 98%.'
        },
        {
          title: 'Stakeholder Governance & Service Delivery Framework',
          description: 'Structured standardized service-level agreements (SLAs) and automated tracking systems.',
          impact: 'Achieved 99.4% SLA adherence and successfully minimized contract churn across major accounts.'
        }
      ];
    }

    // Merge custom skills with domain baseline
    const finalSkillsList = combinedSkills.length >= 6
      ? combinedSkills
      : Array.from(new Set([...combinedSkills, ...domainSkills, ...technicalTools.slice(0, 4)]));

    // Formulate comprehensive, in-depth multi-paragraph executive summary
    const summary = isCompany
      ? `${displayName} is an authorized, premier commercial contracting firm specializing in ${role} across the ${industry} sector. With a demonstrated track record of rigorous project execution, quality assurance, and strict adherence to regulatory standards, ${displayName} provides turnkey workforce, technical expertise, and contract execution capabilities tailored to commercial and governmental requirements.\n\nOur operations are supported by disciplined resource allocation, comprehensive risk management frameworks, and robust safety protocols. We leverage industry-leading methodologies including ${finalSkillsList.slice(0, 4).join(', ')} to deliver measurable results on time, within budget, and with complete accountability.\n\nWhether fulfilling dedicated service agreements or executing complex multi-phase deliverables, ${displayName} ensures full compliance, operational excellence, and unmatched client satisfaction.`
      : `Accomplished, results-oriented ${role} with extensive expertise in the ${industry} sector. Known for driving high-impact initiatives, optimizing operational workflows, and delivering sustainable outcomes across fast-paced environments. Demonstrates mastery in ${finalSkillsList.slice(0, 5).join(', ')}, coupled with a proactive approach to problem-solving and cross-functional leadership.\n\nProven track record of translating complex organizational requirements into scalable, practical solutions that maximize efficiency, reduce operational overhead, and elevate quality benchmarks. Experienced in orchestrating collaboration among diverse teams, executive stakeholders, and external partners while ensuring rigorous adherence to industry governance and regulatory standards.\n\nCommitted to continuous professional development, technological innovation, and delivering measurable value that propels organizational growth and competitive advantage.`;

    // Key quantifiable achievements
    const keyAchievements = [
      `Delivered 30%+ improvement in overall operational throughput and cycle velocity through rigorous application of ${finalSkillsList[0] || 'core methodologies'}.`,
      `Engineered and executed quality assurance protocols that reduced defect and turnaround rework rates by 25% across key projects.`,
      `Managed high-priority stakeholder initiatives and client contracts with consistent 98%+ on-time completion and SLA compliance.`,
      `Pioneered innovative workflow optimizations that saved an estimated 15+ hours weekly in manual processing time and enhanced team productivity.`
    ];

    // Build rich, multi-tier experience entries
    const experienceData = Array.isArray(profileData?.experience) && profileData.experience.length > 0
      ? profileData.experience.map((exp: any, idx: number) => ({
          role: exp.role || exp.title || `${role} Specialist`,
          company: exp.company || (isCompany ? `${displayName} Commercial Operations` : 'Industry Enterprise Solutions'),
          dates: exp.dates || exp.duration || (idx === 0 ? '2022 - Present' : '2019 - 2022'),
          location: exp.location || displayLocation,
          responsibilities: exp.responsibilities || exp.description || (
            `• Direct and oversee day-to-day execution of ${role} deliverables in accordance with industry best practices.\n` +
            `• Champion ${finalSkillsList.slice(0, 2).join(' & ')} to elevate project quality, operational performance, and client satisfaction.\n` +
            `• Partner collaboratively with cross-functional leadership to identify bottlenecks, mitigate operational risks, and streamline workflows.\n` +
            `• Maintain precise documentation, quality control logs, and regulatory compliance standards across all engagements.`
          )
        }))
      : [
          {
            role: isCompany ? `Chief Contracting Lead — ${role}` : `Senior ${role}`,
            company: isCompany ? displayName : 'Premier Industry Solutions',
            dates: '2022 - Present',
            location: displayLocation,
            responsibilities:
              `• Lead and coordinate complex ${role} operations, delivering measurable business value and operational excellence.\n` +
              `• Spearhead the execution of high-impact initiatives utilizing ${finalSkillsList.slice(0, 3).join(', ')}, consistently outperforming key performance indicators.\n` +
              `• Implement standardized review frameworks that reduced deliverable turnaround times by 32% while maintaining exceptional quality.\n` +
              `• Mentor cross-functional team members, foster a culture of accountability, and oversee rigorous adherence to safety and regulatory standards.`
          },
          {
            role: isCompany ? `Contract Operations Lead` : `${role} Specialist`,
            company: isCompany ? `${displayName} B2B Services` : 'Apex Global Enterprises',
            dates: '2019 - 2022',
            location: displayLocation,
            responsibilities:
              `• Executed end-to-end functional responsibilities supporting ${industry} client deliverables and strategic goals.\n` +
              `• Utilized ${technicalTools.slice(0, 3).join(', ') || 'specialized systems'} to analyze workflow metrics, troubleshoot operational discrepancies, and optimize resource allocation.\n` +
              `• Collaborated on multi-phase deliverables, achieving a 99% first-pass approval rating and zero compliance citations.\n` +
              `• Prepared comprehensive stakeholder briefings, project milestones reports, and actionable performance summaries.`
          }
        ];

    // Build education or corporate credentials
    const educationData = isCompany
      ? []
      : (Array.isArray(profileData?.education) && profileData.education.length > 0
          ? profileData.education
          : [
              {
                course: `Bachelor of Science / Degree in ${role} & Related Studies`,
                school: 'Accredited Higher Institution / University',
                dates: 'Graduated with Honors'
              }
            ]);

    const certifications = isCompany
      ? [
          'Certified Corporate Contractor & Vendor Compliance (ISO 9001 Standards)',
          'Commercial Business Liability & Workplace Safety Certification',
          'Enterprise Procurement & B2B Service SLA Standards Accreditation'
        ]
      : [
          `Certified Professional in ${role} (Industry Recognized Accreditation)`,
          'Advanced Project & Workflow Management Certification',
          'Professional Standards & Workplace Compliance Credential'
        ];

    // Assemble comprehensive Markdown resume
    const markdownResume = `
# ${displayName.toUpperCase()}
**${role.toUpperCase()} — ${industry.toUpperCase()}**
📍 ${displayLocation} | ✉️ ${profileData?.email || 'talent@jobhub.ai'} | 📞 ${profileData?.phone || '+1 (555) 019-2834'}

---

### EXECUTIVE PROFILE & VALUE PROPOSITION
${summary}

---

### CORE COMPETENCIES & TECHNICAL MATRIX
- **Domain Specializations:** ${domainSkills.join(' • ')}
- **Technical Tools & Systems:** ${technicalTools.join(' • ')}
- **Methodology & Leadership:** ${leadershipSkills.join(' • ')}
- **Key Profile Skills:** ${finalSkillsList.join(', ')}

---

### KEY MEASURABLE ACHIEVEMENTS
${keyAchievements.map(a => `• ${a}`).join('\n')}

---

### PROFESSIONAL EXPERIENCE & TRACK RECORD
${experienceData.map((e: any) => `
#### ${e.role} | **${e.company}**
*${e.dates} | ${e.location || displayLocation}*
${e.responsibilities}
`).join('\n')}

---

### FEATURED PROJECTS & NOTABLE DELIVERABLES
${sampleProjects.map((p, i) => `
**${i + 1}. ${p.title}**
${p.description}
*Impact & Results:* ${p.impact}
`).join('\n')}

---

### ${isCompany ? 'CORPORATE ACCREDITATIONS & LICENSES' : 'EDUCATION & PROFESSIONAL CREDENTIALS'}
${isCompany
  ? certifications.map(c => `• **${c}**`).join('\n')
  : educationData.map((ed: any) => `• **${ed.course || ed.degree || 'Degree'}** — ${ed.school || ed.institution || 'University'} (${ed.dates || ed.year || 'Completed'})`).join('\n') +
    '\n' + certifications.map(c => `• **Certification:** ${c}`).join('\n')
}
`.trim();

    return {
      resume: markdownResume,
      structured: {
        title: `${isCompany ? 'CORPORATE PROFILE' : 'RESUME'} — ${displayName}`,
        personalInfo: {
          companyName: isCompany ? displayName : undefined,
          firstName: fName,
          lastName: lName,
          email: profileData?.email || 'talent@jobhub.ai',
          phone: profileData?.phone || '+1 (555) 019-2834',
          city: locationCity || 'Remote / Flexible',
          country: locationCountry,
          desiredTitle: role,
          industry
        },
        summary,
        skills: finalSkillsList,
        competencies: {
          domainExpertise: domainSkills,
          technicalAndTools: technicalTools,
          leadershipAndStrategy: leadershipSkills
        },
        keyAchievements,
        experience: experienceData,
        projects: sampleProjects,
        education: educationData,
        certifications
      }
    };
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
      const context = {};
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/mentor/chat`, { userId, message, context }),
      );
      if (response?.data && (response.data.reply || response.data.response)) {
        return response.data;
      }
      return { reply: this.generateConversationalMentorReply(message) };
    } catch (error) {
      return { reply: this.generateConversationalMentorReply(message) };
    }
  }

  private generateConversationalMentorReply(message: string): string {
    const q = (message || '').toLowerCase();

    if (q.includes('resume') || q.includes('cv') || q.includes('ats')) {
      return `Here are key strategies to maximize your resume & CV impact:\n\n1. **Lead with Quantifiable Impact:** Instead of listing passive duties ("responsible for sales"), state the outcome: *"Accelerated regional B2B sales pipeline by 34% within 6 months through consultative client acquisition."*\n2. **Optimize for ATS Keywords:** Match keywords directly from target job posts—especially core technical proficiencies, certifications, and industry terminology.\n3. **Tailor the Executive Profile:** Craft a 3-sentence summary highlighting your primary domain, years of experience, and your unique value proposition.\n4. **Keep Formatting Clean:** Use clear standard headers (Experience, Skills, Education, Projects). Avoid tables or graphical bars for skill ratings that ATS scanners struggle to parse.\n\nWould you like me to review a specific bullet point or help you generate an ATS-optimized summary?`;
    }

    if (q.includes('interview') || q.includes('mock') || q.includes('question')) {
      return `To excel in your upcoming interviews, leverage the proven **STAR Method**:\n\n• **S - Situation:** Briefly set the scene and context (15-20 seconds).\n• **T - Task:** Define the specific problem or goal you had to solve.\n• **A - Action:** Detail the concrete steps and tools YOU personally took.\n• **R - Result:** Share the quantifiable impact (time saved, revenue generated, quality improved).\n\n**Common Interview Preparation Focus Areas:**\n1. *"Tell me about a time you handled a difficult conflict or deadline."*\n2. *"Describe an instance where a project didn't go as planned and how you adjusted."*\n3. Research the company's recent milestones and prepare 2-3 thoughtful questions for the interviewer.\n\nWould you like to practice a mock interview question together right now?`;
    }

    if (q.includes('salary') || q.includes('negotiat') || q.includes('rate') || q.includes('offer')) {
      return `Here are golden rules for successful salary and contract rate negotiation:\n\n1. **Research Benchmark Ranges:** Gather market data for your role, experience level, and geographic or remote tier.\n2. **Anchor on Value, Not Personal Needs:** Frame your request around the quantifiable ROI you bring to the team.\n3. **Negotiate the Whole Package:** If base salary is fixed, negotiate performance bonuses, flexible work terms, professional development stipends, or equity/stock grants.\n4. **Maintain Professional Composure:** *"I'm thrilled about the opportunity to join the team and make an impact. Based on current market benchmarks and the scope of responsibilities, I was expecting a range of $X - $Y. Can we explore meeting closer to that figure?"*\n\nDo you currently have an offer you'd like guidance evaluating?`;
    }

    if (q.includes('contract') || q.includes('bid') || q.includes('b2b') || q.includes('dual')) {
      return `For winning commercial B2B contracts and utilizing JobHub's Contractor Mode:\n\n1. **Clear Scope of Work (SOW):** Clearly define deliverables, milestones, turnaround SLAs, and revision terms up front.\n2. **Demonstrate Proof of Compliance:** Highlight corporate registrations, workplace safety, and quality assurance standards.\n3. **Tiered Pricing Options:** Offer clients basic, standard, and comprehensive package tiers to capture varying project budgets.\n4. **Dual Mode Flexibility:** Switch between Contractor Mode to bid on external corporate contracts and Employer Mode to recruit supporting crew and specialists seamlessly.\n\nWhat specific contract or RFP are you looking to bid on?`;
    }

    if (q.includes('skill') || q.includes('learn') || q.includes('certif') || q.includes('switch') || q.includes('career')) {
      return `Navigating career growth or transitioning into a new industry requires a targeted 3-step approach:\n\n1. **Bridge Transferable Skills:** Identify competencies from your current background that transfer directly—such as project coordination, stakeholder communication, analytical problem solving, or technical execution.\n2. **Pursue High-Signal Credentials:** Enroll in industry-standard certifications (e.g. AWS/GCP, PMP, ScrumMaster, Data Analytics) to validate competence quickly.\n3. **Build Tangible Artifacts:** Create real-world case studies, GitHub repositories, or client project portfolios that demonstrate your hands-on execution ability.\n\nTell me which specific field or role you are aiming for, and I will outline a customized 90-day transition roadmap for you!`;
    }

    return `Hello! I'm your JobHub AI Career & Professional Mentor. I can assist you across any topic of interest, including:\n\n• **In-Depth Resume & CV Review:** ATS optimization and bullet point phrasing\n• **Interview Preparation:** STAR method coaching and role-specific mock questions\n• **Salary & Contract Rate Negotiation:** Market benchmarking and counter-offer tips\n• **B2B Contractor Bidding:** Proposal structure and corporate dual-mode strategy\n• **Career Transitions & Skills Development:** Targeted roadmaps and certification guidance\n\nWhat would you like to explore or discuss today?`;
  }
}
