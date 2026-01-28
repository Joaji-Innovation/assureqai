/**
 * QA Parameter Service
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QAParameter, QAParameterDocument } from '../../database/schemas/qa-parameter.schema';

@Injectable()
export class QaParameterService {
  constructor(
    @InjectModel(QAParameter.name) private qaParameterModel: Model<QAParameterDocument>,
  ) {}

  async create(data: any): Promise<QAParameter> {
    const qaParameter = new this.qaParameterModel(data);
    return qaParameter.save();
  }

  async findById(id: string): Promise<QAParameter> {
    const param = await this.qaParameterModel.findById(id).exec();
    if (!param) {
      throw new NotFoundException(`QA Parameter set ${id} not found`);
    }
    return param;
  }

  async findByProject(projectId?: string): Promise<QAParameter[]> {
    const filter = projectId ? { projectId: new Types.ObjectId(projectId) } : {};
    return this.qaParameterModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, data: any): Promise<QAParameter> {
    const param = await this.qaParameterModel
      .findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true })
      .exec();
    if (!param) {
      throw new NotFoundException(`QA Parameter set ${id} not found`);
    }
    return param;
  }

  async delete(id: string): Promise<void> {
    const result = await this.qaParameterModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`QA Parameter set ${id} not found`);
    }
  }
}
