/**
 * App Module - Main application module
 * Configured with industry-standard security and logging
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';

// Libs
import { AuthModule, JwtAuthGuard, RolesGuard } from '@assureqai/auth';
import { LIMITS } from '@assureqai/common';

// App modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../modules/audit/audit.module';
import { QueueModule } from '../modules/queue/queue.module';
import { CampaignModule } from '../modules/campaign/campaign.module';
import { UsersModule } from '../modules/users/users.module';
import { AiModule } from '../modules/ai/ai.module';
import { QaParameterModule } from '../modules/qa-parameter/qa-parameter.module';
import { SopModule } from '../modules/sop/sop.module';
import { EmailModule } from '../modules/email/email.module';
import { ContactModule } from '../modules/contact/contact.module';
import { PricingModule } from '../modules/pricing/pricing.module';
import { AlertsModule } from '../modules/alerts/alerts.module';
import { InstanceModule } from '../modules/instance/instance.module';
import { TemplateModule } from '../modules/template/template.module';
import { DisputeModule } from '../modules/dispute/dispute.module';
import { CalibrationModule } from '../modules/calibration/calibration.module';
import { AnnouncementModule } from '../modules/announcement/announcement.module';
import { ProvisioningModule } from '../modules/provisioning/provisioning.module';
import { BackupModule } from '../modules/backup/backup.module';
import { CreditsModule } from '../modules/credits/credits.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

// Config
import { WinstonLoggerConfig } from '../config/logger.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Logger
    WinstonLoggerConfig,

    // Database
    DatabaseModule,

    // Cache (for CacheInterceptor)
    CacheModule.register({
      isGlobal: true,
      ttl: 30000, // 30 seconds default TTL
      max: 100, // Maximum number of items in cache
    }),

    // Event Emitter (for real-time alerts)
    EventEmitterModule.forRoot(),

    // Queue
    QueueModule,

    // AI
    AiModule,

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: LIMITS.API_REQUESTS_PER_MINUTE,
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: LIMITS.API_REQUESTS_PER_HOUR,
      },
    ]),

    // Auth
    AuthModule,

    // Feature modules
    HealthModule,
    UsersModule,
    AuditModule,
    CampaignModule,
    QaParameterModule,
    SopModule,
    EmailModule,
    ContactModule,
    PricingModule,
    AlertsModule,
    InstanceModule,
    TemplateModule,
    DisputeModule,
    CalibrationModule,
    AnnouncementModule,
    ProvisioningModule,
    BackupModule,
    CreditsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global guards - applied to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting first
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Then authentication
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Then authorization
    },
  ],
})
export class AppModule { }
