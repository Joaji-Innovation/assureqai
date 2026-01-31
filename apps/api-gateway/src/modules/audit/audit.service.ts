/**
 * Audit Service
 * CRUD operations with MongoDB aggregation for stats
 */
import { Injectable, NotFoundException, Logger, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CallAudit, CallAuditDocument } from '../../database/schemas/call-audit.schema';
import { CreateAuditDto, UpdateAuditDto, AuditFiltersDto } from './dto';
import { PaginatedResult, LIMITS } from '@assureqai/common';
import { AlertsService } from '../alerts/alerts.service';
import { CreditsService } from '../credits/credits.service';

// Use Record for filter type (mongoose 8.x compatible)
type AuditFilter = Record<string, any>;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(CallAudit.name) private auditModel: Model<CallAuditDocument>,
    @Inject(forwardRef(() => AlertsService)) private alertsService: AlertsService,
    @Inject(forwardRef(() => CreditsService)) private creditsService: CreditsService,
  ) { }

  /**
   * Create a new audit
   */
  async create(dto: CreateAuditDto, instanceId?: string): Promise<CallAudit> {
    this.logger.log(`Creating audit: callId=${dto.callId}, auditType=${dto.auditType}, campaignName=${dto.campaignName}`);

    // Deduct audit credit if instanceId is provided
    if (instanceId) {
      try {
        const creditResult = await this.creditsService.useAuditCredits(instanceId);
        if (!creditResult.success) {
          throw new BadRequestException('Insufficient audit credits. Please contact admin to add more credits.');
        }
        this.logger.log(`Deducted 1 audit credit for instance ${instanceId}. Remaining: ${creditResult.remaining}`);
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        this.logger.warn(`Failed to deduct credit for instance ${instanceId}: ${error}`);
        // Allow audit if credit service fails (graceful degradation)
      }
    }

    const audit = new this.auditModel(dto);
    const savedAudit = await audit.save();

    this.logger.log(`Audit saved successfully: id=${savedAudit._id}, callId=${savedAudit.callId}, score=${dto.overallScore}`);

    // Trigger alerts based on audit results
    try {
      await this.alertsService.checkAndTriggerAlerts(savedAudit.toObject(), dto.projectId);
    } catch (error) {
      this.logger.warn(`Failed to check alerts for audit: ${error}`);
    }

    return savedAudit;
  }

  /**
   * Find audit by ID
   */
  async findById(id: string): Promise<CallAudit> {
    const audit = await this.auditModel.findById(id).exec();
    if (!audit) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }
    return audit;
  }

  /**
   * Find audits with filters and pagination
   */
  async findWithFilters(
    filters: AuditFiltersDto,
    page = 1,
    limit = LIMITS.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<CallAudit>> {
    const query: AuditFilter = {};

    // Build filter query
    if (filters.projectId) {
      query.projectId = new Types.ObjectId(filters.projectId);
    }
    if (filters.agentUserId) {
      query.agentUserId = new Types.ObjectId(filters.agentUserId);
    }
    if (filters.campaignId) {
      query.campaignId = new Types.ObjectId(filters.campaignId);
    }
    if (filters.auditType) {
      query.auditType = filters.auditType;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }
    if (filters.minScore !== undefined) {
      query.overallScore = { $gte: filters.minScore };
    }
    if (filters.disputeStatus) {
      query.disputeStatus = filters.disputeStatus;
    }

    this.logger.log(`Finding audits with query: ${JSON.stringify(query)}, page=${page}, limit=${limit}`);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.auditModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments(query).exec(),
    ]);

    this.logger.log(`Found ${total} audits (returning ${data.length} for page ${page})`);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get comprehensive dashboard statistics using aggregation
   */
  async getStats(
    projectId?: string,
    dateRange?: { start: Date; end: Date },
    filters?: { auditType?: 'ai' | 'manual'; campaignName?: string }
  ) {
    const match: AuditFilter = {};

    if (projectId) {
      match.projectId = new Types.ObjectId(projectId);
    }
    if (dateRange) {
      match.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }
    if (filters?.auditType) {
      match.auditType = filters.auditType;
    }
    if (filters?.campaignName) {
      match.campaignName = filters.campaignName;
    }

    // Main stats aggregation
    const [stats] = await this.auditModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          aiAudits: { $sum: { $cond: [{ $eq: ['$auditType', 'ai'] }, 1, 0] } },
          manualAudits: { $sum: { $cond: [{ $eq: ['$auditType', 'manual'] }, 1, 0] } },
          avgScore: { $avg: '$overallScore' },
          passCount: { $sum: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] } },
          failCount: { $sum: { $cond: [{ $lt: ['$overallScore', 70] }, 1, 0] } },
          totalTokens: { $sum: '$tokenUsage.totalTokens' },
          // Sentiment breakdown
          positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'positive'] }, 1, 0] } },
          neutralCount: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'neutral'] }, 1, 0] } },
          negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'negative'] }, 1, 0] } },
          // Escalation risk
          highRiskCount: { $sum: { $cond: [{ $eq: ['$sentiment.escalationRisk', 'high'] }, 1, 0] } },
          mediumRiskCount: { $sum: { $cond: [{ $eq: ['$sentiment.escalationRisk', 'medium'] }, 1, 0] } },
          // Call metrics averages
          avgTalkRatio: { $avg: '$metrics.talkToListenRatio' },
          avgSilence: { $avg: '$metrics.silencePercentage' },
          avgResponseTime: { $avg: '$metrics.averageResponseTime' },
          avgInterruptions: { $avg: '$metrics.interruptionCount' },
          // Compliance
          complianceViolationCount: { $sum: { $size: { $ifNull: ['$compliance.violations', []] } } },
          avgComplianceScore: { $avg: '$compliance.complianceScore' },
        },
      },
    ]);

    // Daily trend for the date range (last 30 days max)
    const dailyTrend = await this.auditModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
          passCount: { $sum: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      {
        $project: {
          date: '$_id',
          count: 1,
          avgScore: { $round: ['$avgScore', 1] },
          passRate: { $round: [{ $multiply: [{ $divide: ['$passCount', '$count'] }, 100] }, 1] },
        },
      },
    ]);

    // Top failing parameters (from auditResults)
    const topFailingParams = await this.auditModel.aggregate([
      { $match: match },
      { $unwind: '$auditResults' },
      { $match: { 'auditResults.score': { $lt: 70 } } },
      {
        $group: {
          _id: '$auditResults.parameterName',
          failCount: { $sum: 1 },
          avgScore: { $avg: '$auditResults.score' },
        },
      },
      { $sort: { failCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          parameterName: '$_id',
          failCount: 1,
          avgScore: { $round: ['$avgScore', 1] },
        },
      },
    ]);

    // Campaign performance breakdown
    const campaignPerformance = await this.auditModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$campaignName',
          totalAudits: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
          passCount: { $sum: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] } },
        },
      },
      { $sort: { totalAudits: -1 } },
      { $limit: 10 },
      {
        $project: {
          campaignName: { $ifNull: ['$_id', 'Uncategorized'] },
          totalAudits: 1,
          avgScore: { $round: ['$avgScore', 1] },
          passRate: { $round: [{ $multiply: [{ $divide: ['$passCount', '$totalAudits'] }, 100] }, 1] },
        },
      },
    ]);

    if (!stats) {
      return {
        total: 0,
        aiAudits: 0,
        manualAudits: 0,
        avgScore: 0,
        passRate: 0,
        failRate: 0,
        totalTokens: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        escalationRisk: { high: 0, medium: 0, low: 0 },
        callMetrics: { avgTalkRatio: 50, avgSilence: 5, avgResponseTime: 2, avgInterruptions: 0 },
        compliance: { violationCount: 0, avgScore: 100 },
        dailyTrend: [],
        topFailingParams: [],
        campaignPerformance: [],
      };
    }

    return {
      total: stats.total,
      aiAudits: stats.aiAudits,
      manualAudits: stats.manualAudits,
      avgScore: Math.round(stats.avgScore * 100) / 100,
      passRate: stats.total > 0 ? Math.round((stats.passCount / stats.total) * 100) : 0,
      failRate: stats.total > 0 ? Math.round((stats.failCount / stats.total) * 100) : 0,
      totalTokens: stats.totalTokens || 0,
      sentimentBreakdown: {
        positive: stats.positiveCount || 0,
        neutral: stats.neutralCount || 0,
        negative: stats.negativeCount || 0,
      },
      escalationRisk: {
        high: stats.highRiskCount || 0,
        medium: stats.mediumRiskCount || 0,
        low: stats.total - (stats.highRiskCount || 0) - (stats.mediumRiskCount || 0),
      },
      callMetrics: {
        avgTalkRatio: Math.round(stats.avgTalkRatio || 50),
        avgSilence: Math.round((stats.avgSilence || 5) * 10) / 10,
        avgResponseTime: Math.round((stats.avgResponseTime || 2) * 10) / 10,
        avgInterruptions: Math.round((stats.avgInterruptions || 0) * 10) / 10,
      },
      compliance: {
        violationCount: stats.complianceViolationCount || 0,
        avgScore: Math.round(stats.avgComplianceScore || 100),
      },
      dailyTrend,
      topFailingParams,
      campaignPerformance,
    };
  }

  /**
   * Get agent performance leaderboard
   */
  async getLeaderboard(projectId?: string, limit = 10) {
    const match: AuditFilter = {};
    if (projectId) {
      match.projectId = new Types.ObjectId(projectId);
    }

    return this.auditModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$agentUserId',
          agentName: { $first: '$agentName' },
          totalAudits: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
          passCount: { $sum: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] } },
        },
      },
      {
        $project: {
          agentUserId: '$_id',
          agentName: 1,
          totalAudits: 1,
          avgScore: { $round: ['$avgScore', 2] },
          passRate: {
            $round: [{ $multiply: [{ $divide: ['$passCount', '$totalAudits'] }, 100] }, 2],
          },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: limit },
    ]);
  }

  /**
   * Update audit
   */
  async update(id: string, dto: UpdateAuditDto): Promise<CallAudit> {
    const audit = await this.auditModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!audit) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }
    return audit;
  }

  /**
   * Delete audit
   */
  async delete(id: string): Promise<void> {
    const result = await this.auditModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }
  }

  /**
   * Check for cached audit by audio hash
   */
  async findByAudioHash(audioHash: string, campaignName?: string): Promise<CallAudit | null> {
    const query: AuditFilter = { audioHash };
    if (campaignName) {
      query.campaignName = campaignName;
    }
    return this.auditModel.findOne(query).exec();
  }
}
