/**
 * Calibration Service - Multi-evaluator calibration sessions
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Calibration, CalibrationDocument, EvaluatorScore } from '../../database/schemas/calibration.schema';

@Injectable()
export class CalibrationService {
  constructor(
    @InjectModel(Calibration.name) private calibrationModel: Model<CalibrationDocument>,
  ) { }

  async create(data: Partial<Calibration>): Promise<Calibration> {
    const calibration = new this.calibrationModel({
      ...data,
      status: 'draft',
    });
    return calibration.save();
  }

  async findAll(status?: string, organizationId?: string): Promise<Calibration[]> {
    const query: any = status ? { status } : {};
    if (organizationId) query.organizationId = organizationId;
    return this.calibrationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<Calibration> {
    const calibration = await this.calibrationModel.findById(id).exec();
    if (!calibration) throw new NotFoundException(`Calibration ${id} not found`);
    return calibration;
  }

  async update(id: string, data: Partial<Calibration>): Promise<Calibration> {
    const calibration = await this.calibrationModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!calibration) throw new NotFoundException(`Calibration ${id} not found`);
    return calibration;
  }

  async start(id: string): Promise<Calibration> {
    return this.update(id, { status: 'in_progress' });
  }

  async submitScore(id: string, score: {
    evaluatorId: string;
    evaluatorName: string;
    score: number;
    parameterScores?: Record<string, number>;
    comments?: string;
  }): Promise<Calibration> {
    const calibration = await this.calibrationModel.findById(id).exec();
    if (!calibration) throw new NotFoundException(`Calibration ${id} not found`);

    // Check if evaluator already submitted
    const existingIndex = calibration.evaluatorScores.findIndex(
      s => s.evaluatorId === score.evaluatorId
    );

    const newScore = {
      ...score,
      submittedAt: new Date(),
    };

    if (existingIndex >= 0) {
      calibration.evaluatorScores[existingIndex] = newScore as any;
    } else {
      calibration.evaluatorScores.push(newScore as any);
    }

    // Recalculate stats
    const scores = calibration.evaluatorScores.map(s => s.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    let scoreVariance = 0;
    let consistencyRating = 100;

    if (scores.length > 1) {
      scoreVariance = scores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / scores.length;
      consistencyRating = Math.max(0, Math.round(100 - Math.sqrt(scoreVariance) * 5));
    }

    return this.calibrationModel.findByIdAndUpdate(id, {
      evaluatorScores: calibration.evaluatorScores,
      averageScore,
      scoreVariance,
      consistencyRating,
    }, { new: true }).exec();
  }

  async complete(id: string): Promise<Calibration> {
    return this.calibrationModel.findByIdAndUpdate(id, {
      status: 'completed',
      completedAt: new Date(),
    }, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    const result = await this.calibrationModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Calibration ${id} not found`);
  }
}
