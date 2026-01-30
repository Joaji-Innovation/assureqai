/**
 * Webhook Schema
 * Stores webhook configurations for external integrations
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebhookDocument = Webhook & Document;

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: [String], default: [] })
  events: string[]; // 'fatal_failure', 'threshold_breach', 'at_risk', 'compliance', 'low_score'

  @Prop({ default: true })
  active: boolean;

  @Prop()
  secret?: string; // For HMAC signature verification

  @Prop()
  lastTriggered?: Date;

  @Prop()
  lastError?: string;

  @Prop({ default: 0 })
  successCount: number;

  @Prop({ default: 0 })
  failureCount: number;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
