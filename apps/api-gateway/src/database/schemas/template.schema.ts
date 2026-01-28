/**
 * Template Schema - For Starter Templates
 * Industry-specific SOP and Parameter templates
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['sop', 'parameter'] })
  type: 'sop' | 'parameter';

  @Prop({ required: true })
  industry: string; // Insurance, Banking, Telecom, Healthcare, Retail, etc.

  @Prop()
  description?: string;

  @Prop({ type: Object, required: true })
  content: any; // SOP content or QA parameter structure

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  version?: string;

  @Prop()
  createdBy?: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

// Indexes
TemplateSchema.index({ type: 1, industry: 1 });
TemplateSchema.index({ isDefault: 1 });
