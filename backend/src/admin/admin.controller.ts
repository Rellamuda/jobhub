import { Controller, Get, Patch, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
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
}
