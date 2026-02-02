/**
 * Audit Report Schema - For tracking usage from isolated instances
 * Each audit "phones home" with usage data
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditReportDocument = HydratedDocument<AuditReport>;

@Schema({ timestamps: true })
export class AuditReport {
  @Prop({ required: true, index: true })
  instanceId: string; // The clientId/instanceId that sent this report

  @Prop({ required: true })
  apiKey: string; // API key used (for validation)

  @Prop({ required: true })
  auditId: string; // The audit ID from the isolated instance

  @Prop()
  agentName?: string;

  @Prop()
  callId?: string;

  @Prop()
  campaignName?: string;

  @Prop({ required: true })
  auditType: 'ai' | 'manual';

  @Prop({ required: true })
  overallScore: number;

  @Prop()
  maxPossibleScore?: number;

  @Prop()
  audioDurationSeconds?: number; // Duration of the audio file

  @Prop()
  processingDurationMs?: number; // How long the audit took

  @Prop({ default: 0 })
  inputTokens: number;

  @Prop({ default: 0 })
  outputTokens: number;

  @Prop({ default: 0 })
  totalTokens: number;

  @Prop()
  parametersCount?: number; // Number of parameters evaluated

  @Prop({ type: Object })
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
  };

  @Prop()
  hasFatalErrors?: boolean;

  @Prop()
  passStatus?: 'pass' | 'fail';

  @Prop({ default: false })
  isBilled: boolean; // Whether this has been billed/counted

  @Prop()
  billedAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Any additional data
}

export const AuditReportSchema = SchemaFactory.createForClass(AuditReport);

// Indexes for querying
AuditReportSchema.index({ instanceId: 1, createdAt: -1 });
AuditReportSchema.index({ apiKey: 1 });
AuditReportSchema.index({ isBilled: 1 });
AuditReportSchema.index({ createdAt: -1 });
