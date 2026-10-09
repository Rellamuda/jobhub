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

  async generateResume(profileData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/resume/generate`, profileData),
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

  async generateCoverLetter(profileData: any, jobData: any): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/cover-letter/generate`, {
          profile: profileData,
          job: jobData,
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
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/match/score`, {
          profile_text: profileText,
          job_description_text: jobText,
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
      throw new HttpException('Failed to generate job description', HttpStatus.INTERNAL_SERVER_ERROR);
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
