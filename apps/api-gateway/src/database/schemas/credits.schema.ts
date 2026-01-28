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
