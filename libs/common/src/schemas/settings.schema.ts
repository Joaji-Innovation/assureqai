import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
  @Prop({ default: 'AssureQai' })
  platformName!: string;

  @Prop({ default: 'support@assureqai.com' })
  supportEmail!: string;

  @Prop({ default: 'starter', enum: ['starter', 'pro', 'enterprise'] })
  defaultPlan!: string;

  @Prop({ default: 14 })
  trialDays!: number;

  @Prop({ default: true })
  enableSignups!: boolean;

  @Prop({ default: true })
  requireEmailVerification!: boolean;

  @Prop({ default: 10 })
  maxAuditsPerMinute!: number;

  @Prop({ default: 'auto' })
  defaultAuditLanguage!: string;

  @Prop({ default: 365 })
  retentionDays!: number;

  @Prop({ default: true })
  backupEnabled!: boolean;

  @Prop({ default: 'daily', enum: ['hourly', 'daily', 'weekly'] })
  backupSchedule!: string;

  @Prop({ default: 'smtp.example.com' })
  smtpHost!: string;

  @Prop({ default: 587 })
  smtpPort!: number;

  @Prop({ default: 'apikey' })
  smtpUser!: string;

  @Prop({ select: false }) // Hide password by default
  smtpPassword?: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
