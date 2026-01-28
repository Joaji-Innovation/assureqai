/**
 * Template Service - Starter templates management
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from '../../database/schemas/template.schema';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
  ) {}

  async create(data: Partial<Template>): Promise<Template> {
    const template = new this.templateModel(data);
    return template.save();
  }

  async findAll(filters?: { type?: string; industry?: string }): Promise<Template[]> {
    const query: any = { isActive: true };
    if (filters?.type) query.type = filters.type;
    if (filters?.industry) query.industry = filters.industry;
    return this.templateModel.find(query).sort({ industry: 1, name: 1 }).exec();
  }

  async findById(id: string): Promise<Template> {
    const template = await this.templateModel.findById(id).exec();
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async findByIndustry(industry: string): Promise<Template[]> {
    return this.templateModel.find({ industry, isActive: true }).exec();
  }

  async findDefaults(): Promise<Template[]> {
    return this.templateModel.find({ isDefault: true, isActive: true }).exec();
  }

  async update(id: string, data: Partial<Template>): Promise<Template> {
    const template = await this.templateModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async delete(id: string): Promise<void> {
    const result = await this.templateModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Template ${id} not found`);
  }

  // Get available industries
  async getIndustries(): Promise<string[]> {
    return this.templateModel.distinct('industry', { isActive: true }).exec();
  }

  // Seed default templates
  async seedDefaults(): Promise<void> {
    const defaults = [
      {
        name: 'Insurance Claims SOP',
        type: 'sop',
        industry: 'Insurance',
        description: 'Standard SOP for insurance claims call handling',
        content: {
          sections: [
            'Greeting and identification',
            'Claim number verification',
            'Policy coverage explanation',
            'Documentation requirements',
            'Next steps and timeline',
            'Closing and satisfaction check'
          ]
        },
        isDefault: true
      },
      {
        name: 'Banking KYC Parameters',
        type: 'parameter',
        industry: 'Banking',
        description: 'QA parameters for KYC compliance calls',
        content: {
          parameters: [
            { name: 'Identity Verification', weight: 25, type: 'Fatal' },
            { name: 'Documentation Request', weight: 20, type: 'Non-Fatal' },
            { name: 'Compliance Disclosure', weight: 25, type: 'Fatal' },
            { name: 'Customer Service', weight: 15, type: 'Non-Fatal' },
            { name: 'Call Handling', weight: 15, type: 'Non-Fatal' }
          ]
        },
        isDefault: true
      },
      {
        name: 'Telecom Support SOP',
        type: 'sop',
        industry: 'Telecom',
        description: 'Standard SOP for telecom customer support',
        content: {
          sections: [
            'Account verification',
            'Issue identification',
            'Troubleshooting steps',
            'Resolution or escalation',
            'Upsell opportunity',
            'Closing'
          ]
        },
        isDefault: true
      },
      {
        name: 'Healthcare Compliance Parameters',
        type: 'parameter',
        industry: 'Healthcare',
        description: 'HIPAA-compliant QA parameters',
        content: {
          parameters: [
            { name: 'HIPAA Compliance', weight: 30, type: 'Fatal' },
            { name: 'Patient Verification', weight: 25, type: 'Fatal' },
            { name: 'Medical Accuracy', weight: 20, type: 'Non-Fatal' },
            { name: 'Empathy & Bedside Manner', weight: 15, type: 'Non-Fatal' },
            { name: 'Documentation', weight: 10, type: 'Non-Fatal' }
          ]
        },
        isDefault: true
      }
    ];

    for (const template of defaults) {
      const exists = await this.templateModel.findOne({ 
        name: template.name, 
        type: template.type 
      });
      if (!exists) {
        await this.create(template as any);
      }
    }
  }
}
