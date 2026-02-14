/**
 * Credit Transaction Schema - Transaction history
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CreditTransactionDocument = HydratedDocument<CreditTransaction>;

@Schema({ timestamps: true })
export class CreditTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Instance', required: true })
  instanceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId?: Types.ObjectId;

  @Prop({ enum: ['add', 'use', 'expire', 'refund', 'adjust', 'purchase', 'token_conversion'], required: true })
  type: 'add' | 'use' | 'expire' | 'refund' | 'adjust' | 'purchase' | 'token_conversion';

  @Prop({ enum: ['audit', 'token'], required: true })
  creditType: 'audit' | 'token';

  @Prop({ required: true })
  amount: number; // Positive for add, negative for use

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  reason: string;

  @Prop()
  reference?: string; // Audit ID, Campaign ID, etc.

  @Prop()
  paymentId?: string; // Dodo Payments payment ID

  @Prop()
  paymentProvider?: string; // 'dodo'

  @Prop()
  createdBy?: string;
}

export const CreditTransactionSchema = SchemaFactory.createForClass(CreditTransaction);

CreditTransactionSchema.index({ instanceId: 1, createdAt: -1 });
CreditTransactionSchema.index({ instanceId: 1, creditType: 1 });
CreditTransactionSchema.index({ organizationId: 1, createdAt: -1 });
