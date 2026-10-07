import { Controller, Get, Patch, Delete, Param, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
// Ideally protect with @Roles('ADMIN') guard, assuming JwtAuthGuard passes req.user
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
