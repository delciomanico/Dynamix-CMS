import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminController } from './admin/admin.controller';
import { BackupsController } from './admin/backups.controller';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './common/access.service';
import { ComponentsController } from './components/components.controller';
import { ContentsController } from './contents/contents.controller';
import { HealthController } from './health/health.controller';
import { MediaController } from './media/media.controller';
import { PrismaModule } from './prisma/prisma.service';
import { ProjectsController } from './projects/projects.controller';
import { PublicApiController } from './public-api/public-api.controller';
import { StorageModule } from './storage/storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule, StorageModule, AccessModule, AuthModule,
  ],
  controllers: [HealthController, AdminController, BackupsController, ProjectsController, ComponentsController, ContentsController, MediaController, PublicApiController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
