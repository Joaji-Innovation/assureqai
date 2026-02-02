/**
 * Audit Report Service - For receiving usage reports from isolated instances
 */
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditReport, AuditReportDocument } from '../../database/schemas/audit-report.schema';
import { Instance, InstanceDocument } from '../../database/schemas/instance.schema';

export interface CreateAuditReportDto {
  auditId: string;
  agentName?: string;
  callId?: string;
  campaignName?: string;
  auditType: 'ai' | 'manual';
  overallScore: number;
  maxPossibleScore?: number;
  audioDurationSeconds?: number;
  processingDurationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  parametersCount?: number;
  sentiment?: { overall: 'positive' | 'neutral' | 'negative' };
  hasFatalErrors?: boolean;
  passStatus?: 'pass' | 'fail';
  metadata?: Record<string, any>;
}

export interface AuditReportStats {
  totalAudits: number;
  totalAudioMinutes: number;
  totalTokens: number;
  avgScore: number;
  passRate: number;
  byDate: { date: string; count: number; avgScore: number }[];
}

@Injectable()
export class AuditReportService {
  private readonly logger = new Logger(AuditReportService.name);

  constructor(
    @InjectModel(AuditReport.name) private auditReportModel: Model<AuditReportDocument>,
    @InjectModel(Instance.name) private instanceModel: Model<InstanceDocument>,
  ) { }

  /**
   * Receive an audit report from an isolated instance
   * Validates the API key and stores the report
   */
  async create(apiKey: string, dto: CreateAuditReportDto): Promise<AuditReport> {
    // Validate API key and get instance
    const instance = await this.instanceModel.findOne({
      apiKey: apiKey,
      status: { $in: ['active', 'running'] },
    });

    if (!instance) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Create the report
    const report = new this.auditReportModel({
      instanceId: instance.clientId,
      apiKey: apiKey,
      ...dto,
    });

    await report.save();

    // Update instance credits
    await this.instanceModel.findByIdAndUpdate(instance._id, {
      $inc: {
        'credits.usedAudits': 1,
        'credits.usedTokens': dto.totalTokens || 0,
        'credits.totalApiCalls': 1,
      },
    });

    this.logger.log(`Audit report received from ${instance.clientId}: ${dto.auditId}`);

    return report;
  }

  /**
   * Get all audit reports for an instance
   */
  async findByInstance(
    instanceId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: AuditReport[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.auditReportModel
        .find({ instanceId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditReportModel.countDocuments({ instanceId }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get usage statistics for an instance
   */
  async getStats(instanceId: string, startDate?: Date, endDate?: Date): Promise<AuditReportStats> {
    const match: any = { instanceId };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const [stats, dailyStats] = await Promise.all([
      this.auditReportModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalAudits: { $sum: 1 },
            totalAudioSeconds: { $sum: { $ifNull: ['$audioDurationSeconds', 0] } },
            totalTokens: { $sum: { $ifNull: ['$totalTokens', 0] } },
            avgScore: { $avg: '$overallScore' },
            passCount: { $sum: { $cond: [{ $eq: ['$passStatus', 'pass'] }, 1, 0] } },
          },
        },
      ]),
      this.auditReportModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgScore: { $avg: '$overallScore' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    const stat = stats[0] || {
      totalAudits: 0,
      totalAudioSeconds: 0,
      totalTokens: 0,
      avgScore: 0,
      passCount: 0,
    };

    return {
      totalAudits: stat.totalAudits,
      totalAudioMinutes: Math.round(stat.totalAudioSeconds / 60),
      totalTokens: stat.totalTokens,
      avgScore: Math.round(stat.avgScore * 100) / 100,
      passRate: stat.totalAudits > 0 ? Math.round((stat.passCount / stat.totalAudits) * 100) : 0,
      byDate: dailyStats.map((d: any) => ({
        date: d._id,
        count: d.count,
        avgScore: Math.round(d.avgScore * 100) / 100,
      })),
    };
  }

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<{
    totalReports: number;
    totalAudioMinutes: number;
    totalTokens: number;
    byInstance: { instanceId: string; count: number; tokens: number }[];
  }> {
    const [totals, byInstance] = await Promise.all([
      this.auditReportModel.aggregate([
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            totalAudioSeconds: { $sum: { $ifNull: ['$audioDurationSeconds', 0] } },
            totalTokens: { $sum: { $ifNull: ['$totalTokens', 0] } },
          },
        },
      ]),
      this.auditReportModel.aggregate([
        {
          $group: {
            _id: '$instanceId',
            count: { $sum: 1 },
            tokens: { $sum: { $ifNull: ['$totalTokens', 0] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const total = totals[0] || { totalReports: 0, totalAudioSeconds: 0, totalTokens: 0 };

    return {
      totalReports: total.totalReports,
      totalAudioMinutes: Math.round(total.totalAudioSeconds / 60),
      totalTokens: total.totalTokens,
      byInstance: byInstance.map((d: any) => ({
        instanceId: d._id,
        count: d.count,
        tokens: d.tokens,
      })),
    };
  }
}
