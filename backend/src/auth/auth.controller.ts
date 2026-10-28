import { Controller, Post, Get, Delete, Body, HttpCode, HttpStatus, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Request() req, @Body() body: any) {
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '';
    return this.authService.register({
      email: body.email,
      password: body.password,
      role: body.role
    }, clientIp);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    if (!body?.email || !body?.code) {
      throw new BadRequestException('Email and 6-digit verification code are required.');
    }
    return this.authService.verifyEmail(body.email, body.code);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-code')
  async resendCode(@Body() body: { email: string }) {
    if (!body?.email) {
      throw new BadRequestException('Email is required.');
    }
    return this.authService.resendVerificationCode(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    // Return user details including subscription tier
    const user = await this.authService.getUserDetails(req.user.userId);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteMe(@Request() req) {
    await this.authService.deleteAccount(req.user.userId);
    return { success: true, message: 'Account and associated personal data deleted successfully.' };
  }
}
