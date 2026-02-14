/**
 * Project Schema
 * Multi-project support per instance
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'QAParameter' })
  defaultParameterId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SOP' })
  defaultSopId?: Types.ObjectId;

  // Multi-tenant: links this project to a specific organization
  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId?: Types.ObjectId;

  // Links this project to a billing Instance for credit tracking
  @Prop({ type: Types.ObjectId, ref: 'Instance' })
  instanceId?: Types.ObjectId;

  // Project-specific settings
  @Prop({ type: Object })
  settings?: {
    language?: string;
    timezone?: string;
    autoAcknowledge?: boolean;
  };
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes
ProjectSchema.index({ instanceId: 1 });
ProjectSchema.index({ organizationId: 1 });
