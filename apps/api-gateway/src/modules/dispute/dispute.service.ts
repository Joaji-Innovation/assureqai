/**
 * Dispute Service - Agent dispute workflow
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dispute, DisputeDocument } from '../../database/schemas/dispute.schema';

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel(Dispute.name) private disputeModel: Model<DisputeDocument>,
  ) {}

  async create(data: {
    auditId: string;
    agentUserId: string;
    agentName: string;
    reason: string;
    details?: string;
    disputedParameters?: string[];
    originalScore?: number;
  }): Promise<Dispute> {
    const dispute = new this.disputeModel({
      ...data,
      auditId: new Types.ObjectId(data.auditId),
      status: 'pending',
    });
    return dispute.save();
  }

  async findAll(filters?: { 
    status?: string; 
    agentUserId?: string;
  }): Promise<Dispute[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.agentUserId) query.agentUserId = filters.agentUserId;
    return this.disputeModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('auditId')
      .exec();
  }

  async findById(id: string): Promise<Dispute> {
    const dispute = await this.disputeModel.findById(id).populate('auditId').exec();
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    return dispute;
  }

  async findByAudit(auditId: string): Promise<Dispute[]> {
    return this.disputeModel
      .find({ auditId: new Types.ObjectId(auditId) })
      .exec();
  }

  async findByAgent(agentUserId: string): Promise<Dispute[]> {
    return this.disputeModel
      .find({ agentUserId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async resolve(id: string, data: {
    resolution: string;
    resolvedBy: string;
    adjustedScore?: number;
  }): Promise<Dispute> {
    const dispute = await this.disputeModel
      .findByIdAndUpdate(id, {
        status: 'resolved',
        resolution: data.resolution,
        resolvedBy: data.resolvedBy,
        adjustedScore: data.adjustedScore,
        resolvedAt: new Date(),
      }, { new: true })
      .exec();
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    return dispute;
  }

  async reject(id: string, data: {
    resolution: string;
    resolvedBy: string;
  }): Promise<Dispute> {
    const dispute = await this.disputeModel
      .findByIdAndUpdate(id, {
        status: 'rejected',
        resolution: data.resolution,
        resolvedBy: data.resolvedBy,
        resolvedAt: new Date(),
      }, { new: true })
      .exec();
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    return dispute;
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    resolved: number;
    rejected: number;
  }> {
    const [total, pending, resolved, rejected] = await Promise.all([
      this.disputeModel.countDocuments(),
      this.disputeModel.countDocuments({ status: 'pending' }),
      this.disputeModel.countDocuments({ status: 'resolved' }),
      this.disputeModel.countDocuments({ status: 'rejected' }),
    ]);
    return { total, pending, resolved, rejected };
  }
}
