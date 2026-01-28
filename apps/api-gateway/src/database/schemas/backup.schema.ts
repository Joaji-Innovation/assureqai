/**
 * Backup Schema - MongoDB backup records
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BackupDocument = HydratedDocument<Backup>;

@Schema({ timestamps: true })
export class Backup {
  @Prop({ type: Types.ObjectId, ref: 'Instance', required: true })
  instanceId: Types.ObjectId;

  @Prop({ required: true })
  filename: string;

  @Prop()
  s3Key?: string;

  @Prop()
  s3Bucket?: string;

  @Prop({ required: true })
  sizeBytes: number;

  @Prop({ enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  @Prop({ enum: ['manual', 'scheduled', 'auto'], default: 'manual' })
  type: 'manual' | 'scheduled' | 'auto';

  @Prop()
  error?: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  createdBy?: string;
}

export const BackupSchema = SchemaFactory.createForClass(Backup);

BackupSchema.index({ instanceId: 1, createdAt: -1 });
BackupSchema.index({ status: 1 });
