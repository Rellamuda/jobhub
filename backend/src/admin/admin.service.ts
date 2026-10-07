import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          subscriptionTier: true,
          accountStatus: true,
          createdAt: true,
          jobSeekerProfile: {
            select: { firstName: true, lastName: true },
          },
          employer: {
            select: { companyName: true },
          },
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async updateUserStatus(id: string, status: string) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { accountStatus: status },
      });
    } catch (e) {
      throw new InternalServerErrorException('Failed to update status');
    }
  }

  async deleteUser(id: string) {
    try {
      // Must delete related records manually or rely on cascading deletes if configured. 
      // Prisma requires explicit cascading setups. We'll attempt a direct delete, 
      // but in production, cascading rules should be strict.
      await this.prisma.user.delete({
        where: { id },
      });
      return { success: true };
    } catch (e) {
      throw new InternalServerErrorException('Failed to delete user due to relationships');
    }
  }
}
