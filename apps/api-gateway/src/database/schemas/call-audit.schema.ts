/**
 * CallAudit Schema
 * Enhanced with sentiment, compliance, and metrics
 */
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallAuditDocument = CallAudit & Document;

@Schema({ timestamps: true })
export class CallAudit {
  @Prop({ required: true, trim: true })
  callId: string;

  @Prop({ trim: true })
  agentName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  agentUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign' })
  campaignId?: Types.ObjectId;

  @Prop({ trim: true })
  campaignName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ required: true, enum: ['ai', 'manual'], default: 'ai' })
  auditType: 'ai' | 'manual';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  auditedBy?: Types.ObjectId;

  // Transcript and summary
  @Prop()
  transcript?: string;

  @Prop()
  englishTranslation?: string;

  @Prop()
  callSummary?: string;

  @Prop()
  audioUrl?: string;

  @Prop()
  audioHash?: string;

  // Scoring
  @Prop({ type: [Object] })
  auditResults: {
    parameterId: string;
    parameterName: string;
    score: number;
    weight: number;
    type: 'Fatal' | 'Non-Fatal' | 'ZTP';
    comments?: string;
    confidence?: number;  // 0-100 confidence score
    evidence?: {          // Transcript citations
      text: string;
      lineNumber?: number;
      startChar?: number;
      endChar?: number;
    }[];
    subResults?: {
      subParameterId: string;
      subParameterName: string;
      score: number;
      weight: number;
      comments?: string;
      confidence?: number;
      evidence?: { text: string; lineNumber?: number }[];
    }[];
  }[];

  @Prop({ type: Number, min: 0, max: 100 })
  overallScore?: number;

  // Sentiment analysis ⭐ NEW
  @Prop(
    raw({
      overall: { type: String, enum: ['positive', 'neutral', 'negative'] },
      customerScore: { type: Number, min: -1, max: 1 },
      agentScore: { type: Number, min: -1, max: 1 },
      emotionalMoments: [
        {
          timestamp: String,
          emotion: String,
          speaker: String,
        },
      ],
    }),
  )
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    customerScore: number;
    agentScore: number;
    emotionalMoments?: { timestamp: string; emotion: string; speaker: string }[];
  };

  // Call metrics ⭐ NEW
  @Prop(
    raw({
      talkToListenRatio: Number,
      silencePercentage: Number,
      holdTime: Number,
      callDuration: Number,
    }),
  )
  metrics?: {
    talkToListenRatio: number;
    silencePercentage: number;
    holdTime?: number;
    callDuration?: number;
  };

  // Compliance ⭐ NEW
  @Prop(
    raw({
      keywordsDetected: [String],
      violations: [
        {
          rule: String,
          description: String,
          severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        },
      ],
      complianceScore: Number,
    }),
  )
  compliance?: {
    keywordsDetected: string[];
    violations: { rule: string; description: string; severity: string }[];
    complianceScore: number;
  };

  // AI metadata
  @Prop(
    raw({
      inputTokens: Number,
      outputTokens: Number,
      totalTokens: Number,
    }),
  )
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  // Overall confidence score (0-100)
  @Prop({ type: Number, min: 0, max: 100 })
  overallConfidence?: number;

  // Timing metrics
  @Prop(
    raw({
      startTime: Date,
      endTime: Date,
      processingDurationMs: Number,
      promptTokensPerSecond: Number,
    }),
  )
  timing?: {
    startTime: Date;
    endTime: Date;
    processingDurationMs: number;
    promptTokensPerSecond?: number;
  };

  @Prop()
  auditDurationMs?: number; // Legacy field - use timing.processingDurationMs instead

  // Dispute tracking
  @Prop({ enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' })
  disputeStatus: 'none' | 'pending' | 'approved' | 'rejected';

  @Prop()
  disputeReason?: string;

  @Prop()
  disputeResolution?: string;

  // Agent acknowledgment
  @Prop({ default: false })
  acknowledged: boolean;

  @Prop()
  acknowledgedAt?: Date;
}

export const CallAuditSchema = SchemaFactory.createForClass(CallAudit);

// Indexes for performance
CallAuditSchema.index({ createdAt: -1 });
CallAuditSchema.index({ projectId: 1, createdAt: -1 });
CallAuditSchema.index({ agentUserId: 1, createdAt: -1 });
CallAuditSchema.index({ campaignId: 1, createdAt: -1 });
CallAuditSchema.index({ auditType: 1, createdAt: -1 });
CallAuditSchema.index({ audioHash: 1, campaignName: 1 }); // Cache lookup
CallAuditSchema.index({ disputeStatus: 1 });
