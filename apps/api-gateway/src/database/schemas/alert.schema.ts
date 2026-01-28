/**
 * Alert Schema
 * MongoDB schema for storing audit alerts
 */
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlertDocument = Alert & Document;

@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: true })
  type: 'FATAL_FAILURE' | 'THRESHOLD_BREACH' | 'AT_RISK_AGENT' | 'COMPLIANCE_VIOLATION' | 'LOW_SCORE';

  @Prop({ required: true })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  projectId?: string;

  @Prop()
  auditId?: string;

  @Prop()
  agentUserId?: string;

  @Prop()
  agentName?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isAcknowledged: boolean;

  @Prop()
  acknowledgedBy?: string;

  @Prop()
  acknowledgedAt?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Indexes for efficient querying
AlertSchema.index({ projectId: 1, createdAt: -1 });
AlertSchema.index({ type: 1, isRead: 1 });
AlertSchema.index({ agentUserId: 1 });
