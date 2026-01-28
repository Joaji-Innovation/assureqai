/**
 * SOP Service
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sop, SopDocument } from '../../database/schemas/sop.schema';

@Injectable()
export class SopService {
  constructor(
    @InjectModel(Sop.name) private sopModel: Model<SopDocument>,
  ) {}

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
}
