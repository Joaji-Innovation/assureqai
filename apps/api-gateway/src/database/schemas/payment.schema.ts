/**
 * Payment Schema - Tracks all payment transactions
 * Records payments made via Dodo Payments
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Instance' })
  instanceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Who initiated the purchase

  // Dodo Payments references
  @Prop()
  dodoPaymentId?: string;

  @Prop()
  dodoCheckoutSessionId?: string;

  @Prop({ required: true })
  amount: number; // Amount in smallest unit (cents/paise)

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({
    enum: ['pending', 'completed', 'failed', 'refunded', 'expired'],
    default: 'pending',
  })
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'expired';

  // What was purchased
  @Prop({ type: Types.ObjectId, ref: 'CreditPlan' })
  creditPlanId?: Types.ObjectId;

  @Prop({ enum: ['audit', 'token', 'combo'], required: true })
  creditType: 'audit' | 'token' | 'combo';

  @Prop({ default: 0 })
  auditCreditsGranted: number;

  @Prop({ default: 0 })
  tokenCreditsGranted: number;

  @Prop()
  creditsExpiresAt?: Date;

  // Metadata
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  failureReason?: string;

  @Prop()
  refundReason?: string;

  @Prop()
  invoiceUrl?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ organizationId: 1, createdAt: -1 });
PaymentSchema.index({ dodoPaymentId: 1 }, { sparse: true });
PaymentSchema.index({ dodoCheckoutSessionId: 1 }, { sparse: true });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ userId: 1 });
