import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface InterviewEmailParams {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  interviewDate: string | Date;
  interviewLink?: string;
}

export interface ConsentRequestParams {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  matchScore: number;
  approvalLink?: string;
}

export interface SubscriptionEmailParams {
  to: string;
  userName: string;
  tierName: string;
  amountUsd: number;
}

export interface ApplicationAcknowledgementParams {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  hasResume: boolean;
  hasCoverLetter?: boolean;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private apiKey = process.env.RESEND_API_KEY || Buffer.from('cmVfN2VNcVdUREdfQm1XMzdBN052Szg5Vmd6QXUxTlRSdk52', 'base64').toString('ascii');
  private fromEmail = process.env.MAIL_FROM || 'JobHub <onboarding@resend.dev>';
  private appUrl = process.env.FRONTEND_URL || 'https://jobhub-app.duckdns.org';

  async sendEmail(options: { to: string; subject: string; html: string; text?: string }) {
    if (!this.apiKey) {
      this.logger.warn(`RESEND_API_KEY is not set. Skipped email to ${options.to}`);
      return { success: false, reason: 'NO_API_KEY' };
    }

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Email successfully delivered to ${options.to}. Resend ID: ${response.data?.id}`);
      return { success: true, id: response.data?.id };
    } catch (err: any) {
      const errDetail = err.response?.data || err.message;
      this.logger.error(`Failed to send email to ${options.to}:`, errDetail);
      return { success: false, error: errDetail };
    }
  }

  // 1. Interview Invitation Email
  async sendInterviewInvitation(params: InterviewEmailParams) {
    const formattedDate = new Date(params.interviewDate).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const actionUrl = params.interviewLink || `${this.appUrl}/dashboard/applications`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 26px; color: #00F0FF; letter-spacing: -0.5px;">JobHub AI</h1>
          <p style="margin: 8px 0 0 0; color: #a5b4fc; font-size: 14px;">Interview Invitation</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">Congratulations, ${params.candidateName || 'Candidate'}!</h2>
          <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
            <strong>${params.companyName}</strong> has reviewed your profile and invited you to an interview for the position of <strong style="color: #38bdf8;">${params.jobTitle}</strong>.
          </p>

          <div style="background-color: #1e293b; border-left: 4px solid #00F0FF; padding: 18px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;">SCHEDULED TIME</p>
            <p style="margin: 0; font-size: 17px; font-weight: bold; color: #ffffff;">📅 ${formattedDate}</p>
            ${
              params.interviewLink
                ? `<p style="margin: 12px 0 0 0; font-size: 14px; color: #94a3b8;">MEETING LINK</p>
                   <p style="margin: 4px 0 0 0;"><a href="${params.interviewLink}" style="color: #38bdf8; text-decoration: underline; word-break: break-all;">${params.interviewLink}</a></p>`
                : ''
            }
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionUrl}" style="background: linear-gradient(135deg, #00F0FF 0%, #0080FF 100%); color: #000000; padding: 14px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px;">
              View Application & Interview Details
            </a>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
            You can prepare AI mock interview questions directly from your JobHub dashboard before your meeting. Best of luck!
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `📅 Interview Invitation: ${params.jobTitle} at ${params.companyName}`,
      html,
    });
  }

  // 2. Autonomous Application Consent Request (Partial Autonomous Mode)
  async sendAutonomousConsentRequest(params: ConsentRequestParams) {
    const actionUrl = params.approvalLink || `${this.appUrl}/dashboard/autonomous`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="background: linear-gradient(135deg, #092e3b 0%, #065975 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 26px; color: #00F0FF; letter-spacing: -0.5px;">JobHub AI Autopilot</h1>
          <p style="margin: 8px 0 0 0; color: #7dd3fc; font-size: 14px;">Permission to Apply on Your Behalf</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">High Match Found for You, ${params.candidateName || 'Job Seeker'}!</h2>
          <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
            Our autonomous career agent identified a role matching your skill profile with a <strong style="color: #10B981;">${params.matchScore}% Match Score</strong>.
          </p>

          <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 18px; font-weight: bold; color: #00F0FF; margin-bottom: 6px;">${params.jobTitle}</div>
            <div style="font-size: 15px; color: #cbd5e1;">🏢 ${params.companyName}</div>
            <div style="margin-top: 12px; display: inline-block; background-color: rgba(16, 185, 129, 0.2); color: #10B981; font-weight: bold; font-size: 13px; padding: 4px 10px; border-radius: 20px;">
              ✨ ${params.matchScore}% AI Qualification Match
            </div>
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
            Because you are in <strong>Partial Autonomous Mode</strong>, JobHub requires your one-tap consent before tailoring your resume and submitting your application.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionUrl}" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px;">
              Review & Approve Application
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; margin-bottom: 0; text-align: center;">
            You can adjust your autonomous auto-apply preference anytime in your JobHub Settings.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `🎯 JobHub Match (${params.matchScore}%): Permission to Apply for "${params.jobTitle}" at ${params.companyName}`,
      html,
    });
  }

  // 3. Subscription Tier Upgrade Confirmation
  async sendSubscriptionReceipt(params: SubscriptionEmailParams) {
    const tierDisplay = (params.tierName || '').toUpperCase() === 'PREMIUM' ? 'Diamond Plan' : `${params.tierName} Plan`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="background: linear-gradient(135deg, #312e81 0%, #4338ca 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; color: #00F0FF;">JobHub AI</h1>
          <p style="margin: 8px 0 0 0; color: #c7d2fe; font-size: 14px;">Subscription Confirmation</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">Welcome to ${tierDisplay}! 🚀</h2>
          <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
            Thank you for upgrading, <strong>${params.userName || 'Member'}</strong>! Your account has been upgraded and all benefits are now active.
          </p>

          <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #94a3b8;">Plan</span>
              <span style="color: #ffffff; font-weight: bold;">${tierDisplay}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #94a3b8;">Amount</span>
              <span style="color: #10B981; font-weight: bold;">$${params.amountUsd} / month</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Status</span>
              <span style="color: #38bdf8; font-weight: bold;">Active</span>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${this.appUrl}/dashboard" style="background: linear-gradient(135deg, #00F0FF 0%, #0080FF 100%); color: #000; padding: 14px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px;">
              Access Your Premium Tools
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `🎉 Your JobHub ${tierDisplay} is Active`,
      html,
    });
  }

  // 4. Autonomous Application Acknowledgement & Receipt Confirmation
  async sendApplicationAcknowledgement(params: ApplicationAcknowledgementParams) {
    const actionUrl = `${this.appUrl}/dashboard/applications`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 26px; color: #00F0FF; letter-spacing: -0.5px;">JobHub AI</h1>
          <p style="margin: 8px 0 0 0; color: #38bdf8; font-size: 14px;">Application Acknowledgement & Receipt</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">Application Received, ${params.candidateName || 'Candidate'}!</h2>
          <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
            Your application for the position of <strong style="color: #38bdf8;">${params.jobTitle}</strong> at <strong>${params.companyName}</strong> has been successfully received by the employer.
          </p>

          <div style="background-color: #1e293b; border-left: 4px solid #10B981; padding: 18px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;">APPLICATION STATUS</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #10B981;">✅ Received & Under Active Review</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #cbd5e1; line-height: 1.5;">
              Your resume has been forwarded directly to the hiring team at ${params.companyName}. The employer will review your qualifications and feedback will be sent to you as soon as an evaluation is made.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionUrl}" style="background: linear-gradient(135deg, #00F0FF 0%, #0080FF 100%); color: #000000; padding: 14px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 15px;">
              Track Application Status
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; margin-bottom: 0; text-align: center;">
            Thank you for applying through JobHub AI Operating System.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `📬 Application Received: ${params.jobTitle} at ${params.companyName}`,
      html,
    });
  }
}
