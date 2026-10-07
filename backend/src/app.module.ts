import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ProfilesModule } from './profiles/profiles.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { AiModule } from './ai/ai.module';
import { UploadsModule } from './uploads/uploads.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MessagesModule } from './messages/messages.module';
import { ResumesModule } from './resumes/resumes.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'public'),
      serveRoot: '/',
    }),
    PrismaModule, 
    UsersModule, 
    AuthModule, ProfilesModule, JobsModule, ApplicationsModule, AiModule, UploadsModule, MessagesModule, ResumesModule, PaymentsModule, AdminModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
