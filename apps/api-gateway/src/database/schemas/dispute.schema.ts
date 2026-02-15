/**
 * Dispute Schema - Agent dispute workflow
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DisputeDocument = HydratedDocument<Dispute>;

@Schema({ timestamps: true })
export class Dispute {
  @Prop({ type: Types.ObjectId, ref: 'CallAudit', required: true })
  auditId: Types.ObjectId;

  @Prop({ required: true })
  agentUserId: string;

  @Prop({ required: true })
  agentName: string;

  @Prop({ required: true })
  reason: string;

  @Prop()
  details?: string;

  @Prop({ type: [String], default: [] })
  disputedParameters: string[]; // Which parameters are being disputed

  @Prop({ enum: ['pending', 'under_review', 'resolved', 'rejected'], default: 'pending' })
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';

  @Prop()
  resolution?: string;

  @Prop()
  resolvedBy?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  originalScore?: number;

  @Prop()
  adjustedScore?: number;

  @Prop()
  organizationId?: string;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);

DisputeSchema.index({ agentUserId: 1, status: 1 });
DisputeSchema.index({ auditId: 1 });
DisputeSchema.index({ status: 1, createdAt: -1 });
