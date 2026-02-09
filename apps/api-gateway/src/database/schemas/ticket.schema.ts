/**
 * Ticket Schema
 * Support ticket system with embedded messages
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

// Ticket categories
export const TICKET_CATEGORIES = {
  TECHNICAL: 'technical',
  BILLING: 'billing',
  FEATURE_REQUEST: 'feature_request',
  BUG_REPORT: 'bug_report',
  OTHER: 'other',
} as const;

export type TicketCategory =
  (typeof TICKET_CATEGORIES)[keyof typeof TICKET_CATEGORIES];

// Ticket priorities
export const TICKET_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TicketPriority =
  (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES];

// Ticket statuses
export const TICKET_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PENDING_CUSTOMER: 'pending_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type TicketStatus =
  (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

// Embedded message schema
@Schema({ timestamps: true })
export class TicketMessage {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true })
  authorRole: string;

  @Prop({ default: false })
  isInternal: boolean; // Admin-only notes

  @Prop({ default: Date.now })
  createdAt: Date;
}

// Attachment schema
@Schema()
export class TicketAttachment {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  type: string;

  @Prop()
  size: number;
}

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, unique: true })
  ticketNumber: string; // Auto-generated: TKT-000001

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(TICKET_CATEGORIES),
    default: TICKET_CATEGORIES.OTHER,
  })
  category: TicketCategory;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(TICKET_PRIORITIES),
    default: TICKET_PRIORITIES.MEDIUM,
  })
  priority: TicketPriority;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(TICKET_STATUSES),
    default: TICKET_STATUSES.OPEN,
  })
  status: TicketStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  createdByName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop()
  assignedToName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: [TicketAttachment], default: [] })
  attachments: TicketAttachment[];

  @Prop({ type: [TicketMessage], default: [] })
  messages: TicketMessage[];

  @Prop()
  resolvedAt?: Date;

  @Prop()
  closedAt?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Indexes
TicketSchema.index({ ticketNumber: 1 }, { unique: true });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ createdBy: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ projectId: 1 });
TicketSchema.index({ createdAt: -1 });

// Pre-save hook to generate ticket number (atomic via findOneAndUpdate counter)
TicketSchema.pre('save', async function () {
  if (this.isNew && !this.ticketNumber) {
    const mongoose = require('mongoose');
    const counter = await mongoose.connection.db
      .collection('counters')
      .findOneAndUpdate(
        { _id: 'ticketNumber' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
    this.ticketNumber = `TKT-${String(counter.seq).padStart(6, '0')}`;
  }
});
