import { Injectable, UnauthorizedException, ConflictException, BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isDisposableEmail } from './disposable-email.validator';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory sliding window IP rate limiter for account registrations
  private registrationBurstWindow = new Map<string, number[]>();
  private readonly MAX_REGISTRATIONS_PER_HOUR = 5;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private checkRegistrationRateLimit(ip: string) {
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return;
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    let timestamps = this.registrationBurstWindow.get(ip) || [];
    timestamps = timestamps.filter((t) => t > oneHourAgo);

    if (timestamps.length >= this.MAX_REGISTRATIONS_PER_HOUR) {
      this.logger.warn(`Registration IP limit exceeded for IP: ${ip} (${timestamps.length} in 1 hr)`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Too many accounts have been created from this IP address. Please try again later or contact support.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.registrationBurstWindow.set(ip, timestamps);
  }

  async register(data: Prisma.UserCreateInput, clientIp?: string) {
    if (clientIp) {
      this.checkRegistrationRateLimit(clientIp);
    }

    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    // Anti-Spam: Block throwaway and burner email domains
    if (isDisposableEmail(cleanEmail)) {
      throw new BadRequestException(
        'Disposable or temporary email addresses are not permitted. Please use a permanent email address (e.g., Gmail, Outlook, or corporate email).',
      );
    }

    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const existingUser = await this.usersService.findByEmail(cleanEmail);
    if (existingUser) {
      throw new ConflictException('This email is already registered. Please log in or use another email.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const validRole = data.role === 'EMPLOYER' ? 'EMPLOYER' : 'JOB_SEEKER';

    // Generate 6-digit verification code valid for 15 minutes
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        email: cleanEmail,
        role: validRole,
        password: hashedPassword,
        isEmailVerified: false,
        verificationCode,
        verificationExpires,
      },
    });

    // Send 6-digit verification code email
    try {
      await this.mailService.sendVerificationCodeEmail({
        to: user.email,
        code: verificationCode,
        role: user.role,
      });
    } catch (err) {
      this.logger.error(`Failed to send verification code email to ${user.email}:`, err);
    }

    // DO NOT issue access_token yet. User must verify email code first.
    return {
      requiresVerification: true,
      email: user.email,
      role: user.role,
      message: 'A 6-digit verification code has been sent to your email. Please enter it to continue.',
    };
  }

  async verifyEmail(email: string, code: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    if (!cleanEmail || !cleanCode) {
      throw new BadRequestException('Email and verification code are required.');
    }

    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      throw new BadRequestException('Account not found with this email.');
    }

    if (user.isEmailVerified) {
      const payload = { email: user.email, sub: user.id, role: user.role };
      return {
        success: true,
        alreadyVerified: true,
        access_token: this.jwtService.sign(payload),
        user: { id: user.id, email: user.email, role: user.role },
        profileComplete: false,
      };
    }

    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      throw new BadRequestException('Invalid verification code. Please check your email and try again.');
    }

    if (!user.verificationExpires || new Date() > user.verificationExpires) {
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    // Mark email as verified and clear code
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    // Send registration welcome email upon successful verification
    try {
      await this.mailService.sendRegistrationWelcomeEmail({
        to: updatedUser.email,
        role: updatedUser.role as any,
      });
    } catch (err) {
      this.logger.error(`Failed to send welcome email after verification:`, err);
    }

    let profileComplete = false;
    let profilePicture: string | null = null;
    let displayName = '';
    let verificationStatus = 'UNVERIFIED';

    if (updatedUser.role === 'JOB_SEEKER') {
      const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId: updatedUser.id } });
      profileComplete = !!profile && profile.firstName.length > 0;
      profilePicture = profile?.profilePicture || null;
      displayName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';
      verificationStatus = profile?.verificationStatus || 'UNVERIFIED';
    } else if (updatedUser.role === 'EMPLOYER') {
      const profile = await this.prisma.employer.findUnique({ where: { userId: updatedUser.id } });
      profileComplete = !!profile && profile.companyName.length > 0;
      profilePicture = profile?.profilePicture || null;
      displayName = profile?.companyName || '';
      verificationStatus = profile?.verificationStatus || 'UNVERIFIED';
    }

    const payload = { email: updatedUser.email, sub: updatedUser.id, role: updatedUser.role };
    return {
      success: true,
      access_token: this.jwtService.sign(payload),
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        subscriptionTier: updatedUser.subscriptionTier,
        profilePicture,
        displayName: displayName || updatedUser.email,
        verificationStatus,
      },
      profileComplete,
    };
  }

  async resendVerificationCode(email: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new BadRequestException('Email is required.');
    }

    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      throw new BadRequestException('No account found with this email.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('This email is already verified. You can log in directly.');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationExpires,
      },
    });

    await this.mailService.sendVerificationCodeEmail({
      to: user.email,
      code: verificationCode,
      role: user.role,
    });

    return {
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
    };
  }

  async login(email: string, pass: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Block unverified non-admin users from logging in or accessing onboarding
    if (!user.isEmailVerified && user.role !== 'ADMIN') {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationExpires,
        },
      });

      try {
        await this.mailService.sendVerificationCodeEmail({
          to: user.email,
          code: verificationCode,
          role: user.role,
        });
      } catch (err) {
        this.logger.error(`Failed to send verification code email on login:`, err);
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          requiresVerification: true,
          email: user.email,
          role: user.role,
          message: 'Please verify your email address to continue. A 6-digit verification code has been sent to your email.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    let profileComplete = false;
    let profilePicture: string | null = null;
    let displayName = '';
    let verificationStatus = 'UNVERIFIED';

    if (user.role === 'JOB_SEEKER') {
      const profile = await this.prisma.jobSeekerProfile.findUnique({ where: { userId: user.id } });
      profileComplete = !!profile && profile.firstName.length > 0;
      profilePicture = profile?.profilePicture || null;
      displayName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';
      verificationStatus = profile?.verificationStatus || 'UNVERIFIED';
    } else if (user.role === 'EMPLOYER') {
      const profile = await this.prisma.employer.findUnique({ where: { userId: user.id } });
      profileComplete = !!profile && profile.companyName.length > 0;
      profilePicture = profile?.profilePicture || null;
      displayName = profile?.companyName || '';
      verificationStatus = profile?.verificationStatus || 'UNVERIFIED';
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        profilePicture,
        displayName,
        verificationStatus,
      },
      profileComplete,
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionTier: true,
        freeGenerationsUsed: true,
        jobSeekerProfile: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
            verificationStatus: true,
            seekerType: true,
            companyName: true,
            businessRegNumber: true,
            crewSize: true,
            isDualCapacity: true,
            residenceCountry: true,
            residenceState: true,
            residenceCity: true,
            phone: true,
            headline: true,
            summary: true,
            bio: true,
            skills: true,
            preferredIndustry: true,
          }
        },
        employer: {
          select: {
            companyName: true,
            profilePicture: true,
            verificationStatus: true,
            businessType: true,
            website: true,
            description: true,
            industry: true,
            companySize: true,
            registrationNumber: true,
            locationCountry: true,
            locationState: true,
            locationCity: true,
            hrContactName: true,
            hrEmail: true,
            hrPhone: true,
          }
        }
      }
    });

    if (!user) return null;

    const profilePicture = user.role === 'JOB_SEEKER' 
      ? (user.jobSeekerProfile?.profilePicture || user.employer?.profilePicture)
      : (user.employer?.profilePicture || user.jobSeekerProfile?.profilePicture);

    const isCompany = user.jobSeekerProfile?.seekerType === 'COMPANY_CONTRACTOR' ||
      user.jobSeekerProfile?.isDualCapacity ||
      !!user.employer?.companyName;

    const displayName = user.role === 'JOB_SEEKER'
      ? ((isCompany && user.jobSeekerProfile?.companyName)
          ? user.jobSeekerProfile.companyName
          : `${user.jobSeekerProfile?.firstName || ''} ${user.jobSeekerProfile?.lastName || ''}`.trim())
      : (user.employer?.companyName || user.jobSeekerProfile?.companyName || '');

    const verificationStatus = user.role === 'JOB_SEEKER'
      ? (user.jobSeekerProfile?.verificationStatus || user.employer?.verificationStatus || 'UNVERIFIED')
      : (user.employer?.verificationStatus || user.jobSeekerProfile?.verificationStatus || 'UNVERIFIED');

    return {
      ...user,
      profilePicture: profilePicture || null,
      displayName: displayName || user.email,
      verificationStatus,
    };
  }

  async switchRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { jobSeekerProfile: true, employer: true },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (user.role === 'ADMIN') {
      return { success: true, message: 'Admins cannot toggle role', role: 'ADMIN' };
    }

    const newRole = user.role === 'JOB_SEEKER' ? 'EMPLOYER' : 'JOB_SEEKER';

    // If switching to EMPLOYER: ensure all data from jobSeekerProfile is persisted to employer
    if (newRole === 'EMPLOYER') {
      const companyName = user.jobSeekerProfile?.companyName ||
        user.employer?.companyName ||
        `${user.jobSeekerProfile?.firstName || ''} ${user.jobSeekerProfile?.lastName || ''}`.trim() ||
        'Enterprise Partner';

      const desc = user.jobSeekerProfile?.summary ||
        user.jobSeekerProfile?.bio ||
        user.jobSeekerProfile?.headline ||
        user.employer?.description ||
        `${companyName} - Verified commercial contractor and employer on JobHub Global.`;

      const ind = user.jobSeekerProfile?.preferredIndustry ||
        user.employer?.industry ||
        'Commercial Contracting & Services';

      const repName = `${user.jobSeekerProfile?.firstName || ''} ${user.jobSeekerProfile?.lastName || ''}`.trim() ||
        user.employer?.hrContactName ||
        'Principal Representative';

      const sizeStr = user.jobSeekerProfile?.crewSize
        ? `${user.jobSeekerProfile.crewSize} Staff / Crew`
        : (user.employer?.companySize || '1-10');

      if (!user.employer) {
        await this.prisma.employer.create({
          data: {
            user: { connect: { id: userId } },
            companyName,
            businessType: user.jobSeekerProfile?.seekerType === 'COMPANY_CONTRACTOR' ? 'Corporate Contractor / Agency' : 'Direct Employer',
            registrationNumber: user.jobSeekerProfile?.businessRegNumber || null,
            locationCountry: user.jobSeekerProfile?.residenceCountry || null,
            locationState: user.jobSeekerProfile?.residenceState || null,
            locationCity: user.jobSeekerProfile?.residenceCity || null,
            profilePicture: user.jobSeekerProfile?.profilePicture || null,
            description: desc,
            industry: ind,
            hrContactName: repName,
            hrEmail: user.email,
            hrPhone: user.jobSeekerProfile?.phone || null,
            companySize: sizeStr,
            verificationStatus: user.jobSeekerProfile?.verificationStatus || 'UNVERIFIED',
          },
        });
      } else {
        // Employer exists: update fields with latest values from contractor profile so data never disappears
        await this.prisma.employer.update({
          where: { userId },
          data: {
            companyName: user.employer.companyName || companyName,
            businessType: user.employer.businessType || (user.jobSeekerProfile?.seekerType === 'COMPANY_CONTRACTOR' ? 'Corporate Contractor / Agency' : 'Direct Employer'),
            registrationNumber: user.employer.registrationNumber || user.jobSeekerProfile?.businessRegNumber || null,
            locationCountry: user.employer.locationCountry || user.jobSeekerProfile?.residenceCountry || null,
            locationState: user.employer.locationState || user.jobSeekerProfile?.residenceState || null,
            locationCity: user.employer.locationCity || user.jobSeekerProfile?.residenceCity || null,
            profilePicture: user.employer.profilePicture || user.jobSeekerProfile?.profilePicture || null,
            description: user.employer.description || desc,
            industry: user.employer.industry || ind,
            hrContactName: user.employer.hrContactName || repName,
            hrEmail: user.employer.hrEmail || user.email,
            hrPhone: user.employer.hrPhone || user.jobSeekerProfile?.phone || null,
            companySize: user.employer.companySize || sizeStr,
            verificationStatus: (user.employer.verificationStatus === 'VERIFIED' || user.jobSeekerProfile?.verificationStatus === 'VERIFIED') ? 'VERIFIED' : (user.employer.verificationStatus || 'UNVERIFIED'),
          },
        });
      }
    }

    // If switching to JOB_SEEKER: ensure employer changes sync back to contractor profile
    if (newRole === 'JOB_SEEKER') {
      if (!user.jobSeekerProfile) {
        await this.prisma.jobSeekerProfile.create({
          data: {
            user: { connect: { id: userId } },
            firstName: user.employer?.companyName || 'Corporate',
            lastName: 'Contractor',
            seekerType: 'COMPANY_CONTRACTOR',
            companyName: user.employer?.companyName,
            businessRegNumber: user.employer?.registrationNumber,
            isDualCapacity: true,
            residenceCountry: user.employer?.locationCountry || null,
            residenceState: user.employer?.locationState || null,
            residenceCity: user.employer?.locationCity || null,
            profilePicture: user.employer?.profilePicture || null,
            summary: user.employer?.description || null,
            preferredIndustry: user.employer?.industry || null,
            verificationStatus: user.employer?.verificationStatus || 'UNVERIFIED',
          },
        });
      } else {
        await this.prisma.jobSeekerProfile.update({
          where: { userId },
          data: {
            companyName: user.employer?.companyName || user.jobSeekerProfile.companyName,
            businessRegNumber: user.employer?.registrationNumber || user.jobSeekerProfile.businessRegNumber,
            residenceCountry: user.jobSeekerProfile.residenceCountry || user.employer?.locationCountry,
            residenceState: user.jobSeekerProfile.residenceState || user.employer?.locationState,
            residenceCity: user.jobSeekerProfile.residenceCity || user.employer?.locationCity,
            profilePicture: user.jobSeekerProfile.profilePicture || user.employer?.profilePicture,
            summary: user.jobSeekerProfile.summary || user.employer?.description,
            preferredIndustry: user.jobSeekerProfile.preferredIndustry || user.employer?.industry,
            verificationStatus: (user.employer?.verificationStatus === 'VERIFIED' || user.jobSeekerProfile.verificationStatus === 'VERIFIED') ? 'VERIFIED' : user.jobSeekerProfile.verificationStatus,
          },
        });
      }
    }

    // Update role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    const payload = { email: updatedUser.email, sub: updatedUser.id, role: updatedUser.role };
    const access_token = this.jwtService.sign(payload);

    return {
      success: true,
      message: `Switched mode to ${newRole === 'EMPLOYER' ? 'Employer / Hiring Mode' : 'Contractor / Job Mode'}`,
      role: newRole,
      access_token,
    };
  }

  async deleteAccount(userId: string) {
    return this.usersService.deleteAccount(userId);
  }
}
