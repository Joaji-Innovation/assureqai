/**
 * SOP Schema
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SopDocument = HydratedDocument<Sop>;

@Schema({ timestamps: true })
export class Sop {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  fileName?: string;

  @Prop()
  fileType?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  content?: string; // Base64 encoded file content

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const SopSchema = SchemaFactory.createForClass(Sop);
