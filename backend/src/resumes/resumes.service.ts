import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
const pdfParse = require('pdf-parse');
import * as puppeteer from 'puppeteer';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ResumesService {
  private readonly fastApiUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000/ai';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private uploadsService: UploadsService,
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

      // Save the resume file persistently to Cloud Storage (S3/R2) or local disk
      let resumeUrl: string | null = null;
      try {
        resumeUrl = await this.uploadsService.uploadFile(file, 'resumes');
        await this.prisma.jobSeekerProfile.updateMany({
          where: { userId },
          data: { resumeUrl },
        });
      } catch (uploadErr) {
        console.warn('Could not persist resume file buffer:', uploadErr);
      }

      // Send to AI service for structured parsing
      // Assume AI service is running on localhost:8000
      const aiResponse = await firstValueFrom(
        this.httpService.post(`${this.fastApiUrl}/parse-resume`, { text: rawText })
      );

      return {
        ...aiResponse.data,
        resumeUrl,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to parse resume');
    }
  }

  async saveResume(userId: string, data: any) {
    let profile = await this.prisma.jobSeekerProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { employerProfile: true }
      });
      if (user) {
        profile = await this.prisma.jobSeekerProfile.create({
          data: {
            userId,
            firstName: user.firstName || 'Representative',
            lastName: user.lastName || '',
            headline: user.employerProfile?.companyName ? `${user.employerProfile.companyName} Corporate Capability Profile` : 'Company Profile',
            seekerType: 'COMPANY_CONTRACTOR',
            companyName: user.employerProfile?.companyName || null,
            isDualCapacity: true,
          }
        });
      } else {
        throw new NotFoundException('Profile not found');
      }
    }

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
    const pi = resume.personalInfo || {};
    const companyName = pi.companyName || resume.jobSeekerProfile?.companyName || null;
    const isCompany = !!companyName || pi.seekerType === 'COMPANY_CONTRACTOR' || resume.jobSeekerProfile?.seekerType === 'COMPANY_CONTRACTOR';
    const displayedCompanyName = companyName || pi.companyName || 'Corporate Contractor Services';

    // Safety fallback for arrays
    const experience = Array.isArray(resume.experience) ? resume.experience : [];
    const education = Array.isArray(resume.education) ? resume.education : [];
    const skills = Array.isArray(resume.skills) ? resume.skills : [];
    const projects = Array.isArray(resume.projects) ? resume.projects : [];
    const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];

    const expHtml = experience.map((exp: any) => `
      <div class="job">
        <div class="job-header">
          <span class="job-title">${exp.title || exp.role || ''}</span>
          <span class="job-company">${exp.company || ''} | ${exp.startDate || exp.dates || ''} ${exp.endDate ? '- ' + exp.endDate : ''}</span>
        </div>
        <div class="job-desc">${exp.description || exp.responsibilities || ''}</div>
      </div>
    `).join('');

    const eduHtml = education.map((edu: any) => `
      <div class="job">
        <div class="job-header">
          <span class="job-title">${edu.degree || edu.course || ''}</span>
          <span class="job-company">${edu.school || ''} | ${edu.graduationDate || edu.dates || ''}</span>
        </div>
      </div>
    `).join('');

    const projectsHtml = projects.map((prj: any) => `
      <div class="job">
        <div class="job-header">
          <span class="job-title">${prj.title || ''}</span>
          ${prj.liveLink ? `<span class="job-company"><a href="${prj.liveLink}" target="_blank" style="color: #4f46e5; text-decoration: none;">View Project</a></span>` : ''}
        </div>
        <div class="job-desc">${prj.description || ''}</div>
      </div>
    `).join('');

    const certHtml = certifications.map((cert: any) => `
      <div class="job">
        <div class="job-header">
          <span class="job-title">${cert.name || ''}</span>
          <span class="job-company">${cert.date || cert.issuingBody || ''}</span>
        </div>
      </div>
    `).join('');

    const skillsHtml = skills.join(', ');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${isCompany ? displayedCompanyName : (pi.firstName || '') + ' ' + (pi.lastName || '')} - Resume</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; font-size: 14px; margin: 0; padding: 0; background: #ffffff; }
          .container { max-width: 820px; margin: 0 auto; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 25px; }
          .badge { font-size: 12px; font-weight: 800; letter-spacing: 2px; color: #4338ca; text-transform: uppercase; margin-bottom: 8px; }
          .name { font-size: 28px; font-weight: 800; margin: 0 0 8px 0; color: #111827; letter-spacing: 0.5px; }
          .representative { font-size: 14px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
          .contact { font-size: 13px; color: #6b7280; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 15px; font-weight: 800; color: #111827; text-transform: uppercase; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; letter-spacing: 0.8px; }
          .job { margin-bottom: 16px; page-break-inside: avoid; }
          .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
          .job-title { font-weight: 700; font-size: 14.5px; color: #111827; }
          .job-company { font-style: italic; color: #4b5563; font-size: 13px; }
          .job-desc { font-size: 13px; color: #374151; white-space: pre-line; line-height: 1.45; }
          .skills-box { font-size: 13.5px; color: #374151; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${isCompany ? `
              <div class="badge">CORPORATE CONTRACTOR PROFILE & RESUME</div>
              <h1 class="name">${displayedCompanyName}</h1>
              <div class="representative">Principal Representative: ${pi.firstName || ''} ${pi.lastName || ''}</div>
            ` : `
              <div class="badge">EXECUTIVE RESUME</div>
              <h1 class="name">${pi.firstName || ''} ${pi.lastName || ''}</h1>
            `}
            <div class="contact">
              ${pi.email ? pi.email + ' &bull; ' : ''}
              ${pi.phone ? pi.phone + ' &bull; ' : ''}
              ${pi.city ? pi.city + (pi.country ? ', ' + pi.country : '') : (pi.country || '')}
              ${pi.website ? ' &bull; ' + pi.website : ''}
            </div>
          </div>
          
          ${resume.summary ? `
          <div class="section">
            <div class="section-title">${isCompany ? 'Company Overview & Capability Statement' : 'Professional Summary'}</div>
            <p style="margin: 0; line-height: 1.6;">${resume.summary}</p>
          </div>
          ` : ''}
          
          ${expHtml ? `
          <div class="section">
            <div class="section-title">${isCompany ? 'Past Performance & Corporate Experience' : 'Professional Experience'}</div>
            ${expHtml}
          </div>
          ` : ''}

          ${projectsHtml ? `
          <div class="section">
            <div class="section-title">${isCompany ? 'Completed Contracts & Major Projects' : 'Key Projects'}</div>
            ${projectsHtml}
          </div>
          ` : ''}
          
          ${eduHtml && education.length > 0 ? `
          <div class="section">
            <div class="section-title">Education & Academic Training</div>
            ${eduHtml}
          </div>
          ` : ''}

          ${certHtml ? `
          <div class="section">
            <div class="section-title">Certifications, Licenses & Accreditations</div>
            ${certHtml}
          </div>
          ` : ''}
          
          ${skillsHtml ? `
          <div class="section">
            <div class="section-title">${isCompany ? 'Core Competencies & Services Offered' : 'Key Skills & Proficiencies'}</div>
            <div class="skills-box">${skillsHtml}</div>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }
}
