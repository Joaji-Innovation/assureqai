/**
 * QA Parameter Service
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QAParameter, QAParameterDocument } from '../../database/schemas/qa-parameter.schema';
import { DEFAULT_TEMPLATES, getTemplateOptions, DefaultParameterTemplate } from './default-templates';

@Injectable()
export class QaParameterService {
  constructor(
    @InjectModel(QAParameter.name) private qaParameterModel: Model<QAParameterDocument>,
  ) { }

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
    // If projectId provided, return parameters for that project OR orphan parameters (no projectId)
    // This ensures backward compatibility with data created before multi-project support
    const filter = projectId
      ? { $or: [{ projectId: new Types.ObjectId(projectId) }, { projectId: { $exists: false } }, { projectId: null }] }
      : {};
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

  /**
   * Get available default templates
   */
  getTemplates(): { id: string; name: string; description: string }[] {
    return getTemplateOptions();
  }

  /**
   * Get a specific template by ID
   */
  getTemplate(templateId: string): DefaultParameterTemplate | null {
    return DEFAULT_TEMPLATES[templateId] || null;
  }

  /**
   * Create parameter set from a template
   */
  async createFromTemplate(
    templateId: string,
    projectId: string,
    createdBy?: string,
    customName?: string,
  ): Promise<QAParameter> {
    const template = DEFAULT_TEMPLATES[templateId];
    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    const qaParameter = new this.qaParameterModel({
      name: customName || template.name,
      description: template.description,
      projectId: new Types.ObjectId(projectId),
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
      isActive: true,
      isDefault: false,
      parameters: template.parameters,
    });

    return qaParameter.save();
  }

  /**
   * Seed default parameters for a new project
   * Creates all default templates for the project
   */
  async seedDefaultParameters(projectId: string, createdBy?: string): Promise<QAParameter[]> {
    const createdParams: QAParameter[] = [];

    for (const [templateId, template] of Object.entries(DEFAULT_TEMPLATES)) {
      const qaParameter = new this.qaParameterModel({
        name: template.name,
        description: template.description,
        projectId: new Types.ObjectId(projectId),
        createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
        isActive: true,
        isDefault: true,
        parameters: template.parameters,
      });

      const saved = await qaParameter.save();
      createdParams.push(saved);
    }

    return createdParams;
  }

  /**
   * Check if a project has any parameters, seed defaults if not
   */
  async ensureProjectHasParameters(projectId: string, createdBy?: string): Promise<void> {
    const existing = await this.qaParameterModel.findOne({
      projectId: new Types.ObjectId(projectId)
    }).exec();

    if (!existing) {
      await this.seedDefaultParameters(projectId, createdBy);
    }
  }
}

