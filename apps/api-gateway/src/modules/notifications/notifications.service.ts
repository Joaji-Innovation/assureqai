/**
 * Notifications Service
 * Manages notification settings and webhooks
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationSettings, NotificationSettingsDocument, AlertRuleConfig, SmtpConfig } from '../../database/schemas/notification-settings.schema';
import { Webhook, WebhookDocument } from '../../database/schemas/webhook.schema';
import axios from 'axios';

export interface UpdateSettingsDto {
  alertRules?: AlertRuleConfig[];
  smtp?: Partial<SmtpConfig>;
  pushNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}

export interface UpdateWebhookDto {
  name?: string;
  url?: string;
  events?: string[];
  active?: boolean;
  secret?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationSettings.name) private settingsModel: Model<NotificationSettingsDocument>,
    @InjectModel(Webhook.name) private webhookModel: Model<WebhookDocument>,
  ) { }

  /**
   * Get or create notification settings for a project
   */
  async getSettings(projectId: string): Promise<NotificationSettingsDocument> {
    let settings = await this.settingsModel.findOne({ projectId: new Types.ObjectId(projectId) });

    if (!settings) {
      // Create default settings
      settings = new this.settingsModel({
        projectId: new Types.ObjectId(projectId),
      });
      await settings.save();
    }

    return settings;
  }

  /**
   * Update notification settings
   */
  async updateSettings(projectId: string, dto: UpdateSettingsDto): Promise<NotificationSettingsDocument> {
    const settings = await this.getSettings(projectId);

    if (dto.alertRules) {
      settings.alertRules = dto.alertRules;
    }
    if (dto.smtp) {
      settings.smtp = { ...settings.smtp, ...dto.smtp } as SmtpConfig;
    }
    if (dto.pushNotificationsEnabled !== undefined) {
      settings.pushNotificationsEnabled = dto.pushNotificationsEnabled;
    }
    if (dto.emailNotificationsEnabled !== undefined) {
      settings.emailNotificationsEnabled = dto.emailNotificationsEnabled;
    }

    await settings.save();
    return settings;
  }

  /**
   * Get all webhooks for a project
   */
  async getWebhooks(projectId: string): Promise<WebhookDocument[]> {
    return this.webhookModel.find({ projectId: new Types.ObjectId(projectId) }).sort({ createdAt: -1 });
  }

  /**
   * Create a webhook
   */
  async createWebhook(projectId: string, dto: CreateWebhookDto): Promise<WebhookDocument> {
    const webhook = new this.webhookModel({
      projectId: new Types.ObjectId(projectId),
      ...dto,
    });
    await webhook.save();
    this.logger.log(`Webhook created: ${dto.name} for project ${projectId}`);
    return webhook;
  }

  /**
   * Update a webhook
   */
  async updateWebhook(webhookId: string, dto: UpdateWebhookDto): Promise<WebhookDocument> {
    const webhook = await this.webhookModel.findByIdAndUpdate(
      webhookId,
      { $set: dto },
      { new: true },
    );
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const result = await this.webhookModel.findByIdAndDelete(webhookId);
    if (!result) {
      throw new NotFoundException('Webhook not found');
    }
  }

  /**
   * Test a webhook by sending a test payload
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
    const webhook = await this.webhookModel.findById(webhookId);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      message: 'This is a test notification from AssureQai',
      data: {
        source: 'AssureQai Notifications',
        webhookName: webhook.name,
      },
    };

    try {
      const response = await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-AssureQai-Event': 'test',
          ...(webhook.secret ? { 'X-AssureQai-Signature': this.generateSignature(testPayload, webhook.secret) } : {}),
        },
        timeout: 10000,
      });

      await this.webhookModel.findByIdAndUpdate(webhookId, {
        lastTriggered: new Date(),
        $inc: { successCount: 1 },
      });

      return { success: true, message: `Webhook responded with status ${response.status}` };
    } catch (error: any) {
      const errorMessage = error.response?.statusText || error.message || 'Unknown error';

      await this.webhookModel.findByIdAndUpdate(webhookId, {
        lastError: errorMessage,
        $inc: { failureCount: 1 },
      });

      return { success: false, message: `Webhook failed: ${errorMessage}` };
    }
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerWebhooks(projectId: string, event: string, payload: any): Promise<void> {
    const webhooks = await this.webhookModel.find({
      projectId: new Types.ObjectId(projectId),
      active: true,
      events: event,
    });

    for (const webhook of webhooks) {
      try {
        await axios.post(webhook.url, {
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-AssureQai-Event': event,
            ...(webhook.secret ? { 'X-AssureQai-Signature': this.generateSignature(payload, webhook.secret) } : {}),
          },
          timeout: 10000,
        });

        await this.webhookModel.findByIdAndUpdate(webhook._id, {
          lastTriggered: new Date(),
          $inc: { successCount: 1 },
        });

        this.logger.log(`Webhook triggered: ${webhook.name} for event ${event}`);
      } catch (error: any) {
        const errorMessage = error.response?.statusText || error.message || 'Unknown error';

        await this.webhookModel.findByIdAndUpdate(webhook._id, {
          lastError: errorMessage,
          $inc: { failureCount: 1 },
        });

        this.logger.error(`Webhook failed: ${webhook.name} - ${errorMessage}`);
      }
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }
}
