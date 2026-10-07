import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB max
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const url = await this.uploadsService.uploadFile(file, 'profiles');

    // Update the profile with the new URL
    if (req.user.role === 'JOB_SEEKER') {
      await this.prisma.jobSeekerProfile.upsert({
        where: { userId: req.user.userId },
        update: { profilePicture: url },
        create: {
          userId: req.user.userId,
          firstName: '', // Dummy defaults, should be updated by the actual profile save route
          lastName: '',
          profilePicture: url,
          skills: [],
        },
      });
    } else if (req.user.role === 'EMPLOYER') {
      await this.prisma.employer.upsert({
        where: { userId: req.user.userId },
        update: { profilePicture: url },
        create: {
          userId: req.user.userId,
          companyName: '',
          profilePicture: url,
        },
      });
    }

    return { url };
  }
}
