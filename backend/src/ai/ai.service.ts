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

  async generateResume(profileData: any): Promise<string> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.fastApiUrl}/resume/generate`, profileData),
      );
      return response.data.resume;
    } catch (error) {
      throw new HttpException(
        'Failed to generate resume via AI service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        'Failed to generate cover letter via AI service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      return response.data.match_score;
    } catch (error) {
      throw new HttpException(
        'Failed to calculate match score via AI service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
