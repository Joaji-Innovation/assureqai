/**
 * Notification Settings Schema
 * Stores notification configuration per project
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationSettingsDocument = NotificationSettings & Document;

@Schema({ _id: false })
export class AlertRuleConfig {
  @Prop({ required: true })
  type: 'fatal_failure' | 'threshold_breach' | 'at_risk' | 'compliance' | 'low_score';

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ type: [String], default: ['push'] })
  channels: ('push' | 'email' | 'webhook')[];

  @Prop({ type: Object, default: {} })
  config: Record<string, any>;
}

@Schema({ _id: false })
export class SmtpConfig {
  @Prop({ default: '' })
  host: string;

  @Prop({ default: 587 })
  port: number;

  @Prop({ default: '' })
  user: string;

  @Prop({ default: '' })
  password: string; // Should be encrypted in production

  @Prop({ default: '' })
  fromName: string;

  @Prop({ default: '' })
  fromEmail: string;

  @Prop({ default: false })
  enabled: boolean;
}

@Schema({ timestamps: true })
export class NotificationSettings {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  projectId: Types.ObjectId;

  @Prop({
    type: [AlertRuleConfig], default: () => [
      { type: 'fatal_failure', enabled: true, channels: ['push', 'email'], config: {} },
      { type: 'threshold_breach', enabled: true, channels: ['push'], config: { threshold: 70 } },
      { type: 'at_risk', enabled: true, channels: ['email'], config: { consecutiveLow: 3 } },
      { type: 'compliance', enabled: false, channels: ['push'], config: {} },
      { type: 'low_score', enabled: true, channels: ['push'], config: { threshold: 60 } },
    ]
  })
  alertRules: AlertRuleConfig[];

  @Prop({ type: SmtpConfig, default: () => ({}) })
  smtp: SmtpConfig;

  @Prop({ default: true })
  pushNotificationsEnabled: boolean;

  @Prop({ default: true })
  emailNotificationsEnabled: boolean;
}

export const NotificationSettingsSchema = SchemaFactory.createForClass(NotificationSettings);
