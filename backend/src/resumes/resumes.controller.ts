import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Req, UseGuards, Res } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  async getResumes(@Req() req: any) {
    return this.resumesService.getResumes(req.user.userId);
  }

  @Get(':id')
  async getResume(@Param('id') id: string, @Req() req: any) {
    return this.resumesService.getResume(id, req.user.userId);
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  async parseResume(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.resumesService.parseResume(file, req.user.userId);
  }

  @Post()
  async saveResume(@Body() data: any, @Req() req: any) {
    return this.resumesService.saveResume(req.user.userId, data);
  }

  @Post(':id/export/pdf')
  async exportPdf(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const pdfBuffer = await this.resumesService.exportPdf(id, req.user.userId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="resume.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post(':id/export/word')
  async exportWord(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const wordBuffer = await this.resumesService.exportWord(id, req.user.userId);
    res.set({
      'Content-Type': 'application/msword',
      'Content-Disposition': `attachment; filename="resume.doc"`,
      'Content-Length': wordBuffer.length,
    });
    res.end(wordBuffer);
  }

  @Post(':id/ats-optimize')
  async atsOptimize(@Param('id') id: string, @Body('jobDescription') jobDescription: string, @Req() req: any) {
    return this.resumesService.atsOptimize(id, req.user.userId, jobDescription);
  }
}
