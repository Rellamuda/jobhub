import { Controller, Get, Post, Patch, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/:id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateUserStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      role?: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
      subscriptionTier?: 'FREE' | 'SILVER' | 'PREMIUM';
      accountStatus?: string;
      isFlagged?: boolean;
      flagReason?: string;
    },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Support & Enquiry Endpoints
  @Post('support-inquiry')
  async createSupportInquiry(
    @Body()
    body: {
      userId?: string;
      name: string;
      email: string;
      category?: string;
      subject: string;
      message: string;
    },
  ) {
    return this.adminService.createSupportInquiry(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inquiries')
  async getInquiries() {
    return this.adminService.getSupportInquiries();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inquiries/:id/status')
  async updateInquiryStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateSupportInquiryStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('inquiries/:id')
  async deleteInquiry(@Param('id') id: string) {
    return this.adminService.deleteSupportInquiry(id);
  }
}
