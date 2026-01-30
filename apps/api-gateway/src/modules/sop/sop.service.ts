/**
 * SOP Service
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sop, SopDocument } from '../../database/schemas/sop.schema';
import { DEFAULT_SOP_TEMPLATES, getSOPTemplateOptions, DefaultSOPTemplate } from './default-sop-templates';

@Injectable()
export class SopService {
  constructor(
    @InjectModel(Sop.name) private sopModel: Model<SopDocument>,
  ) { }

  async create(data: any): Promise<Sop> {
    const sop = new this.sopModel({
      name: data.name,
      description: data.description,
      fileName: data.file?.originalname,
      fileType: data.file?.mimetype,
      fileSize: data.file?.size,
      content: data.file?.buffer?.toString('base64'),
      projectId: data.projectId,
      uploadedBy: data.uploadedBy,
    });
    return sop.save();
  }

  async findById(id: string): Promise<Sop> {
    const sop = await this.sopModel.findById(id).exec();
    if (!sop) {
      throw new NotFoundException(`SOP ${id} not found`);
    }
    return sop;
  }

  async findByProject(projectId?: string): Promise<Sop[]> {
    const filter = projectId ? { projectId: new Types.ObjectId(projectId) } : {};
    return this.sopModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, data: any): Promise<Sop> {
    const sop = await this.sopModel
      .findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true })
      .exec();
    if (!sop) {
      throw new NotFoundException(`SOP ${id} not found`);
    }
    return sop;
  }

  async delete(id: string): Promise<void> {
    const result = await this.sopModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`SOP ${id} not found`);
    }
  }

  /**
   * Get available default SOP templates
   */
  getTemplates(): { id: string; name: string; description: string }[] {
    return getSOPTemplateOptions();
  }

  /**
   * Get a specific SOP template by ID
   */
  getTemplate(templateId: string): DefaultSOPTemplate | null {
    return DEFAULT_SOP_TEMPLATES[templateId] || null;
  }

  /**
   * Create SOP from a template
   */
  async createFromTemplate(
    templateId: string,
    projectId: string,
    uploadedBy?: string,
    customName?: string,
  ): Promise<Sop> {
    const template = DEFAULT_SOP_TEMPLATES[templateId];
    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Store the markdown content as base64 for consistency
    const contentBase64 = Buffer.from(template.content, 'utf-8').toString('base64');

    const sop = new this.sopModel({
      name: customName || template.name,
      description: template.description,
      fileName: `${templateId}_sop.md`,
      fileType: 'text/markdown',
      fileSize: template.content.length,
      content: contentBase64,
      projectId: new Types.ObjectId(projectId),
      uploadedBy: uploadedBy ? new Types.ObjectId(uploadedBy) : undefined,
      isActive: true,
    });

    return sop.save();
  }

  /**
   * Seed default SOPs for a new project
   */
  async seedDefaultSOPs(projectId: string, uploadedBy?: string): Promise<Sop[]> {
    const createdSOPs: Sop[] = [];

    for (const [templateId, template] of Object.entries(DEFAULT_SOP_TEMPLATES)) {
      const contentBase64 = Buffer.from(template.content, 'utf-8').toString('base64');

      const sop = new this.sopModel({
        name: template.name,
        description: template.description,
        fileName: `${templateId}_sop.md`,
        fileType: 'text/markdown',
        fileSize: template.content.length,
        content: contentBase64,
        projectId: new Types.ObjectId(projectId),
        uploadedBy: uploadedBy ? new Types.ObjectId(uploadedBy) : undefined,
        isActive: true,
      });

      const saved = await sop.save();
      createdSOPs.push(saved);
    }

    return createdSOPs;
  }
}

