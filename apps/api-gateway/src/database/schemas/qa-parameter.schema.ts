/**
 * QAParameter Schema
 * Configurable audit criteria
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QAParameterDocument = QAParameter & Document;

@Schema({ timestamps: true })
export class QAParameter {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  // Parameters with sub-parameters
  @Prop({ type: [Object], required: true })
  parameters: {
    id: string;
    name: string;
    weight: number;
    type: 'Fatal' | 'Non-Fatal' | 'ZTP';
    description?: string;
    subParameters?: {
      id: string;
      name: string;
      weight: number;
      description?: string;
    }[];
  }[];
}

export const QAParameterSchema = SchemaFactory.createForClass(QAParameter);

// Indexes
QAParameterSchema.index({ projectId: 1 });
QAParameterSchema.index({ isDefault: 1 });
