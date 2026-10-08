import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(data: Prisma.UserCreateInput) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
      profileComplete: false, // New users don't have a profile yet
    };
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
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
          }
        },
        employer: {
          select: {
            companyName: true,
            profilePicture: true,
            verificationStatus: true,
            businessType: true,
            website: true,
          }
        }
      }
    });

    if (!user) return null;

    const profilePicture = user.role === 'JOB_SEEKER' 
      ? user.jobSeekerProfile?.profilePicture 
      : user.employer?.profilePicture;

    const displayName = user.role === 'JOB_SEEKER'
      ? `${user.jobSeekerProfile?.firstName || ''} ${user.jobSeekerProfile?.lastName || ''}`.trim()
      : user.employer?.companyName || '';

    const verificationStatus = user.role === 'JOB_SEEKER'
      ? user.jobSeekerProfile?.verificationStatus || 'UNVERIFIED'
      : user.employer?.verificationStatus || 'UNVERIFIED';

    return {
      ...user,
      profilePicture: profilePicture || null,
      displayName: displayName || user.email,
      verificationStatus,
    };
  }
}
