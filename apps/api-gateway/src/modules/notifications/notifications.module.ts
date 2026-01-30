/**
 * Notifications Module
 * Handles notification settings and webhooks
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationSettings, NotificationSettingsSchema } from '../../database/schemas/notification-settings.schema';
import { Webhook, WebhookSchema } from '../../database/schemas/webhook.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSettings.name, schema: NotificationSettingsSchema },
      { name: Webhook.name, schema: WebhookSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
