/**
 * Calibration Schema - Multi-evaluator calibration sessions
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CalibrationDocument = HydratedDocument<Calibration>;

// Individual evaluator score
export class EvaluatorScore {
  @Prop({ required: true })
  evaluatorId: string;

  @Prop({ required: true })
  evaluatorName: string;

  @Prop({ required: true })
  score: number;

  @Prop({ type: Object })
  parameterScores: Record<string, number>;

  @Prop()
  comments?: string;

  @Prop()
  submittedAt: Date;
}

@Schema({ timestamps: true })
export class Calibration {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'CallAudit' })
  sampleAuditId?: Types.ObjectId;

  @Prop()
  audioUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'QAParameter' })
  parameterId?: Types.ObjectId;

  @Prop({ type: [EvaluatorScore], default: [] })
  evaluatorScores: EvaluatorScore[];

  @Prop({ enum: ['draft', 'in_progress', 'completed'], default: 'draft' })
  status: 'draft' | 'in_progress' | 'completed';

  @Prop()
  targetScore?: number; // Expected/consensus score

  @Prop()
  createdBy: string;

  @Prop()
  completedAt?: Date;

  // Calculated stats
  @Prop()
  averageScore?: number;

  @Prop()
  scoreVariance?: number;

  @Prop()
  consistencyRating?: number; // 0-100

  @Prop()
  organizationId?: string;
}

export const CalibrationSchema = SchemaFactory.createForClass(Calibration);

CalibrationSchema.index({ status: 1, createdAt: -1 });
