/**
 * Announcement Schema - Platform announcements
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnnouncementDocument = HydratedDocument<Announcement>;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: ['info', 'warning', 'maintenance', 'update'], default: 'info' })
  type: 'info' | 'warning' | 'maintenance' | 'update';

  @Prop({ enum: ['all', 'admins', 'specific'], default: 'all' })
  audience: 'all' | 'admins' | 'specific';

  @Prop({ type: [String], default: [] })
  targetInstanceIds: string[]; // For specific audience

  @Prop()
  scheduledAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdBy?: string;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

AnnouncementSchema.index({ isActive: 1, expiresAt: 1 });
