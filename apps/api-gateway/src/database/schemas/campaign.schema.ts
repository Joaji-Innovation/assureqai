/**
 * Campaign Schema
 * Bulk audit job management
 */
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'paused',
    ],
    default: 'pending',
  })
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'paused';

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'QAParameter', required: true })
  qaParameterSetId: Types.ObjectId;

  @Prop({ trim: true })
  language?: string;

  @Prop({ trim: true })
  transcriptionLanguage?: string;

  // Job tracking
  @Prop({ default: 0 })
  totalJobs: number;

  @Prop({ default: 0 })
  completedJobs: number;

  @Prop({ default: 0 })
  failedJobs: number;

  @Prop({ default: 0 })
  processingJobs: number;

  // Jobs array for individual tracking
  @Prop({ type: [Object] })
  jobs: {
    audioUrl: string;
    agentName?: string;
    callId?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    auditId?: Types.ObjectId;
  }[];

  // Rate limiting
  @Prop({ default: true })
  applyRateLimit: boolean;

  // Timestamps
  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  // Stats
  @Prop(
    raw({
      avgScore: Number,
      totalTokens: Number,
      avgDurationMs: Number,
    }),
  )
  stats?: {
    avgScore: number;
    totalTokens: number;
    avgDurationMs: number;
  };

  // Configuration for Queue Control
  @Prop({
    type: Object,
    default: { rpm: 10, failureThreshold: 20 },
  })
  config: {
    rpm: number; // Rate limit: Audits per minute
    failureThreshold: number; // Pause if failure % > this
  };

  // Internal usage tracking for rate limiting
  @Prop({
    type: Object,
    default: {},
  })
  usage: {
    lastJobStartedAt?: Date;
  };
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);

// Indexes
CampaignSchema.index({ status: 1, createdAt: -1 });
CampaignSchema.index({ projectId: 1 });
CampaignSchema.index({ createdBy: 1 });
