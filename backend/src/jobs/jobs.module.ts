import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AutonomousService } from './autonomous.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobsController],
  providers: [JobsService, AutonomousService],
})
export class JobsModule {}
