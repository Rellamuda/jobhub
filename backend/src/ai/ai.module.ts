import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  providers: [AiService, AiRateLimiterService],
  controllers: [AiController],
  exports: [AiService, AiRateLimiterService],
})
export class AiModule {}
