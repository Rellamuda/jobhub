import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
const pdfParse = require('pdf-parse');
import * as puppeteer from 'puppeteer';

@Injectable()
export class ResumesService {
  private readonly fastApiUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000/ai';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async getResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: {
        jobSeekerProfile: { userId }
      }
    });
  }

  async getResume(id: string, userId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: {
        jobSeekerProfile: true
      }
    });

    if (!resume || resume.jobSeekerProfile.userId !== userId) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async parseResume(file: Express.Multer.File, userId: string) {
    try {
      const data = await pdfParse(file.buffer);
      const rawText = data.text;

      // Send to AI service for structured parsing
      // Assume AI service is running on localhost:8000
      const aiResponse = await firstValueFrom(
        this.httpService.post(`${this.fastApiUrl}/parse-resume`, { text: rawText })
      );

      return aiResponse.data;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to parse resume');
    }
  }

  async saveResume(userId: string, data: any) {
    const profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId }
    });

    if (!profile) throw new NotFoundException('Profile not found');

    if (data.id) {
      return this.prisma.resume.update({
        where: { id: data.id },
        data: {
          title: data.title,
          personalInfo: data.personalInfo,
          summary: data.summary,
          experience: data.experience,
          education: data.education,
          skills: data.skills,
          projects: data.projects,
          certifications: data.certifications,
        }
      });
    }

    return this.prisma.resume.create({
      data: {
        jobSeekerId: profile.id,
        title: data.title || 'Untitled Resume',
        personalInfo: data.personalInfo || {},
        summary: data.summary || '',
        experience: data.experience || [],
        education: data.education || [],
        skills: data.skills || [],
        projects: data.projects || [],
        certifications: data.certifications || [],
      }
    });
  }

  async atsOptimize(id: string, userId: string, jobDescription: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id } });
    if (!resume) throw new NotFoundException('Resume not found');

    try {
      const aiResponse = await firstValueFrom(
        this.httpService.post(`${this.fastApiUrl}/optimize-ats`, {
          resume: resume,
          jobDescription: jobDescription
        })
      );

      return aiResponse.data;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to optimize ATS');
    }
  }

  async exportPdf(id: string, userId: string): Promise<Buffer> {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: { jobSeekerProfile: true }
    });
    if (!resume || resume.jobSeekerProfile.userId !== userId) {
      throw new NotFoundException('Resume not found');
    }

    // Generate HTML for professional template
    const html = this.generateHtmlTemplate(resume);

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  async exportWord(id: string, userId: string): Promise<Buffer> {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: { jobSeekerProfile: true }
    });
    if (!resume || resume.jobSeekerProfile.userId !== userId) {
      throw new NotFoundException('Resume not found');
    }

    const html = this.generateHtmlTemplate(resume);
    return Buffer.from(html, 'utf-8');
  }

  private generateHtmlTemplate(resume: any): string {
    // A highly professional default template
    const pi = resume.personalInfo || {};
    
    // Safety fallback for arrays
    const experience = Array.isArray(resume.experience) ? resume.experience : [];
    const education = Array.isArray(resume.education) ? resume.education : [];
    const skills = Array.isArray(resume.skills) ? resume.skills : [];

    const expHtml = experience.map((exp: any) => `
      <div class="job">
        <div class="job-header">
          <span class="job-title">${exp.title || ''}</span>
          <span class="job-company">${exp.company || ''} | ${exp.startDate || ''} - ${exp.endDate || 'Present'}</span>
        </div>
        <div class="job-desc">${exp.description || ''}</div>
      </div>
    `).join('');

    const eduHtml = education.map((edu: any) => `
      <div class="job">
        <div class="job-header">
          <span class="job-title">${edu.degree || ''}</span>
          <span class="job-company">${edu.school || ''} | ${edu.graduationDate || ''}</span>
        </div>
      </div>
    `).join('');

    const skillsHtml = skills.join(', ');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; font-size: 14px; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 20px; margin-bottom: 20px; }
          .name { font-size: 28px; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 1px; }
          .contact { font-size: 13px; color: #555; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #222; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 0.5px; }
          .job { margin-bottom: 15px; }
          .job-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .job-title { font-weight: bold; font-size: 15px; }
          .job-company { font-style: italic; color: #555; font-size: 13px; }
          .job-desc { font-size: 13px; color: #444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="name">${pi.firstName || ''} ${pi.lastName || ''}</h1>
            <div class="contact">
              ${pi.email ? pi.email + ' | ' : ''}
              ${pi.phone ? pi.phone + ' | ' : ''}
              ${pi.city ? pi.city : ''}
            </div>
          </div>
          
          ${resume.summary ? `
          <div class="section">
            <div class="section-title">Summary</div>
            <p>${resume.summary}</p>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Experience</div>
            ${expHtml}
          </div>
          
          <div class="section">
            <div class="section-title">Education</div>
            ${eduHtml}
          </div>
          
          <div class="section">
            <div class="section-title">Skills</div>
            <p>${skillsHtml}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
