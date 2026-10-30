import { Controller, Delete, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('quota')
  async getMyQuota(@Request() req) {
    return this.usersService.getUserUsageAndQuota(req.user.userId);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteMyAccount(@Request() req) {
    await this.usersService.deleteAccount(req.user.userId);
    return { success: true, message: 'Account and associated personal data deleted successfully.' };
  }
}
