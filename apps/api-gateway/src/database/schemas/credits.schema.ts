/**
 * Credits Schema - Credit balance for instances
 * Managed by Admin Panel, no payment gateway
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CreditsDocument = HydratedDocument<Credits>;

@Schema({ timestamps: true })
export class Credits {
  @Prop({ type: Types.ObjectId, ref: 'Instance', required: true, unique: true })
  instanceId: Types.ObjectId;

  // Multi-tenant: links credits to a specific organization
  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId?: Types.ObjectId;

  // Audit Credits (1 audit = 1 credit)
  @Prop({ default: 0 })
  auditCredits: number;

  @Prop({ default: 0 })
  totalAuditCreditsAllocated: number;

  @Prop({ default: 0 })
  auditCreditsUsed: number;

  // AI Token Credits
  @Prop({ default: 0 })
  tokenCredits: number;

  @Prop({ default: 0 })
  totalTokenCreditsAllocated: number;

  @Prop({ default: 0 })
  tokenCreditsUsed: number;

  // Accumulated tokens towards next audit credit deduction
  // When this reaches tokenToCreditRate (from Settings), 1 audit credit is deducted
  @Prop({ default: 0 })
  tokensTowardsNextCredit: number;

  // Instance Type
  @Prop({ enum: ['trial', 'standard', 'enterprise'], default: 'trial' })
  instanceType: 'trial' | 'standard' | 'enterprise';

  // Trial expiry (if trial)
  @Prop()
  trialExpiresAt?: Date;

  // Alert thresholds (percentage)
  @Prop({ default: 20 })
  lowCreditAlertThreshold: number;

  @Prop({ default: false })
  lowCreditAlertSent: boolean;

  // Block when exhausted
  @Prop({ default: true })
  blockOnExhausted: boolean;

  @Prop()
  lastUpdatedBy?: string;
}

export const CreditsSchema = SchemaFactory.createForClass(Credits);

// Indexes
CreditsSchema.index({ organizationId: 1 }, { sparse: true });
