/**
 * Audit Service
 * CRUD operations with MongoDB aggregation for stats
 */
import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CallAudit,
  CallAuditDocument,
} from '../../database/schemas/call-audit.schema';
import {
  Campaign,
  CampaignDocument,
} from '../../database/schemas/campaign.schema';
import {
  QAParameter,
  QAParameterDocument,
} from '../../database/schemas/qa-parameter.schema';
import { CreateAuditDto, UpdateAuditDto, AuditFiltersDto } from './dto';
import { PaginatedResult, LIMITS } from '@assureqai/common';
import { AlertsService } from '../alerts/alerts.service';
import { CreditsService } from '../credits/credits.service';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';

// Use Record for filter type (mongoose 8.x compatible)
type AuditFilter = Record<string, any>;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(CallAudit.name) private auditModel: Model<CallAuditDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(QAParameter.name)
    private qaParameterModel: Model<QAParameterDocument>,
    @Inject(forwardRef(() => AlertsService))
    private alertsService: AlertsService,
    @Inject(forwardRef(() => CreditsService))
    private creditsService: CreditsService,
    private usageTracking: UsageTrackingService,
  ) { }

  /**
   * Create a new audit
   */
  async create(dto: CreateAuditDto): Promise<CallAudit> {
    this.logger.log(
      `Creating audit: callId=${dto.callId}, auditType=${dto.auditType}, campaignName=${dto.campaignName}`,
    );

    // Deduct audit credit using the globally-resolved instance API key
    const instanceId = this.usageTracking.getInstanceId();
    if (instanceId) {
      try {
        const creditResult =
          await this.creditsService.useAuditCredits(instanceId);
        if (!creditResult.success) {
          throw new BadRequestException(
            'Insufficient audit credits. Please contact admin to add more credits.',
          );
        }
        this.logger.log(
          `Deducted 1 audit credit for instance ${instanceId}. Remaining: ${creditResult.remaining}`,
        );
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        this.logger.warn(
          `Failed to deduct credit for instance ${instanceId}: ${error}`,
        );
        // Allow audit if credit service fails (graceful degradation)
      }
    }

    const audit = new this.auditModel(dto);
    const savedAudit = await audit.save();

    this.logger.log(
      `Audit saved successfully: id=${savedAudit._id}, callId=${savedAudit.callId}, score=${dto.overallScore}`,
    );

    // Deduct token credits if tokenUsage is present (single-audit path)
    if (instanceId && dto.tokenUsage?.totalTokens > 0) {
      try {
        const tokenResult = await this.creditsService.useTokenCredits(
          instanceId,
          dto.tokenUsage.totalTokens,
          savedAudit._id.toString(),
        );
        this.logger.log(
          `Deducted ${dto.tokenUsage.totalTokens} token credits for instance ${instanceId}. ` +
          `Remaining: ${tokenResult.remaining}` +
          (tokenResult.creditsConsumed ? `, audit credits consumed via conversion: ${tokenResult.creditsConsumed}` : ''),
        );
      } catch (error) {
        this.logger.warn(
          `Failed to deduct token credits for instance ${instanceId}: ${error}`,
        );
        // Non-blocking: allow audit even if token credit deduction fails
      }
    }

    // Trigger alerts based on audit results
    try {
      await this.alertsService.checkAndTriggerAlerts(
        savedAudit.toObject(),
        dto.projectId,
      );
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
    if (filters.organizationId) {
      query.organizationId = new Types.ObjectId(filters.organizationId);
    }
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

    this.logger.log(
      `Finding audits with query: ${JSON.stringify(query)}, page=${page}, limit=${limit}`,
    );

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

    this.logger.log(
      `Found ${total} audits (returning ${data.length} for page ${page})`,
    );

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
    filters?: {
      auditType?: 'ai' | 'manual';
      campaignName?: string;
      organizationId?: string;
    },
  ) {
    const match: AuditFilter = {};

    if (filters?.organizationId) {
      match.organizationId = new Types.ObjectId(filters.organizationId);
    }
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

    this.logger.log(`[getStats] Match filter: ${JSON.stringify(match)}`);

    const [stats] = await this.auditModel.aggregate([
      { $match: match },
      {
        $facet: {
          // Basic counts and scores
          overview: [
            {
              $group: {
                _id: null,
                totalAudits: { $sum: 1 },
                totalScore: { $sum: '$overallScore' },
                aiAudits: {
                  $sum: { $cond: [{ $eq: ['$auditType', 'ai'] }, 1, 0] },
                },
                manualAudits: {
                  $sum: { $cond: [{ $eq: ['$auditType', 'manual'] }, 1, 0] },
                },
                passCount: {
                  $sum: { $cond: [{ $gte: ['$overallScore', 80] }, 1, 0] },
                },
                ztpCount: {
                  $sum: { $cond: [{ $eq: ['$overallScore', 0] }, 1, 0] },
                },
              },
            },
          ],
          // Fatal errors analysis
          fatalErrors: [
            {
              $unwind: {
                path: '$auditResults',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $match: {
                'auditResults.type': 'Fatal',
                'auditResults.score': { $lt: 80 },
              },
            },
            {
              $group: {
                _id: null,
                totalFatalErrors: { $sum: 1 },
                fatalAuditIds: { $addToSet: '$_id' },
              },
            },
            {
              $project: {
                totalFatalErrors: 1,
                fatalAuditsCount: { $size: '$fatalAuditIds' },
              },
            },
          ],
          // Daily audits trend
          dailyTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                audits: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', audits: 1, _id: 0 } },
          ],
          // Daily fatal errors trend
          dailyFatalTrend: [
            {
              $unwind: {
                path: '$auditResults',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $match: {
                'auditResults.type': 'Fatal',
                'auditResults.score': { $lt: 80 },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                fatalErrors: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', fatalErrors: 1, _id: 0 } },
          ],
          // Top QA issues
          topIssues: [
            {
              $unwind: {
                path: '$auditResults',
                preserveNullAndEmptyArrays: false,
              },
            },
            { $match: { 'auditResults.score': { $lt: 80 } } },
            {
              $group: {
                _id: '$auditResults.parameterName',
                count: { $sum: 1 },
                totalScore: { $sum: '$auditResults.score' },
                criticalCount: {
                  $sum: { $cond: [{ $lt: ['$auditResults.score', 50] }, 1, 0] },
                },
                type: { $first: '$auditResults.type' },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                parameter: '$_id',
                count: 1,
                avgScore: {
                  $round: [{ $divide: ['$totalScore', '$count'] }, 1],
                },
                totalScore: 1, // Needed for regrouping
                critical: { $gt: ['$criticalCount', 0] },
                type: 1,
                _id: 0,
              },
            },
          ],
          // Agent performance
          agentPerformance: [
            {
              $group: {
                _id: { agentUserId: '$agentUserId', agentName: '$agentName' },
                totalScore: { $sum: '$overallScore' },
                auditCount: { $sum: 1 },
                passCount: {
                  $sum: { $cond: [{ $gte: ['$overallScore', 80] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                agentId: '$_id.agentUserId',
                agentName: '$_id.agentName',
                avgScore: {
                  $round: [{ $divide: ['$totalScore', '$auditCount'] }, 1],
                },
                audits: '$auditCount',
                pass: '$passCount',
                fail: { $subtract: ['$auditCount', '$passCount'] },
                _id: 0,
              },
            },
            { $sort: { avgScore: -1 } },
          ],
          // Campaign performance
          campaignPerformance: [
            {
              $group: {
                _id: '$campaignName',
                totalScore: { $sum: '$overallScore' },
                auditCount: { $sum: 1 },
                complianceIssues: {
                  $sum: {
                    $cond: [
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: { $ifNull: ['$auditResults', []] },
                                as: 'r',
                                cond: {
                                  $and: [
                                    { $eq: ['$$r.type', 'Fatal'] },
                                    { $lt: ['$$r.score', 80] },
                                  ],
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                name: { $ifNull: ['$_id', 'Uncategorized'] },
                avgScore: {
                  $round: [{ $divide: ['$totalScore', '$auditCount'] }, 1],
                },
                audits: '$auditCount',
                compliance: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: ['$auditCount', '$complianceIssues'] },
                            '$auditCount',
                          ],
                        },
                        100,
                      ],
                    },
                    1,
                  ],
                },
                _id: 0,
              },
            },
            { $sort: { audits: -1 } },
          ],
          // Training needs
          trainingNeeds: [
            {
              $unwind: {
                path: '$auditResults',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: {
                  agentUserId: '$agentUserId',
                  agentName: '$agentName',
                  param: '$auditResults.parameterName',
                },
                totalScore: { $sum: '$auditResults.score' },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                agentId: '$_id.agentUserId',
                agentName: '$_id.agentName',
                param: '$_id.param',
                avgScore: {
                  $round: [{ $divide: ['$totalScore', '$count'] }, 1],
                },
                count: 1,
                _id: 0,
              },
            },
            { $sort: { avgScore: 1 } },
            { $limit: 20 },
          ],
          // Sentiment distribution
          sentiment: [
            {
              $group: {
                _id: null,
                totalAudits: { $sum: 1 },
                positive: {
                  $sum: { $cond: [{ $gte: ['$overallScore', 85] }, 1, 0] },
                },
                neutral: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$overallScore', 70] },
                          { $lt: ['$overallScore', 85] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                negative: {
                  $sum: { $cond: [{ $lt: ['$overallScore', 70] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    // Process results
    const overview = stats?.overview?.[0] || {
      totalAudits: 0,
      totalScore: 0,
      aiAudits: 0,
      manualAudits: 0,
      passCount: 0,
      ztpCount: 0,
    };
    const fatalData = stats?.fatalErrors?.[0] || {
      totalFatalErrors: 0,
      fatalAuditsCount: 0,
    };
    const sentimentData = stats?.sentiment?.[0] || {
      totalAudits: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    const totalAudits = overview.totalAudits || 0;
    const overallQAScore =
      totalAudits > 0
        ? parseFloat((overview.totalScore / totalAudits).toFixed(1))
        : 0;
    const fatalRate =
      totalAudits > 0
        ? parseFloat(
          ((fatalData.fatalAuditsCount / totalAudits) * 100).toFixed(1),
        )
        : 0;
    const ztpRate =
      totalAudits > 0
        ? parseFloat(((overview.ztpCount / totalAudits) * 100).toFixed(1))
        : 0;
    const passRate =
      totalAudits > 0
        ? parseFloat(((overview.passCount / totalAudits) * 100).toFixed(1))
        : 0;

    // Agent performance: split into top and underperforming
    const allAgents = stats?.agentPerformance || [];
    const topAgents = allAgents.slice(0, 5);
    const underperformingAgents = allAgents
      .filter((a: any) => a.avgScore < 80)
      .slice(-5)
      .reverse();

    // Training needs: find the agent with the lowest score on any parameter
    const trainingNeedsList = stats?.trainingNeeds || [];
    let primaryTrainingNeed =
      trainingNeedsList.length > 0
        ? {
          agentName: trainingNeedsList[0].agentName,
          lowestParam: trainingNeedsList[0].param,
        }
        : null;

    // Build training needs list for modal (bottom 5 agents by score)
    let trainingNeedsForModal = underperformingAgents.map((agent: any) => {
      // Find worst parameter for this agent
      const agentParams = trainingNeedsList.filter(
        (t: any) => t.agentId === agent.agentId,
      );
      const worstParam = agentParams.length > 0 ? agentParams[0] : null;

      return {
        agentName: agent.agentName,
        agentId: agent.agentId,
        score: agent.avgScore,
        lowestParam: worstParam?.param || 'N/A',
        lowestParamScore: worstParam?.avgScore || 0,
      };
    });

    // Fill in missing dates for daily trends
    const dailyAuditsTrend = stats?.dailyTrend || [];
    const dailyFatalTrend = stats?.dailyFatalTrend || [];

    let filledDailyAuditsTrend = dailyAuditsTrend;
    let filledDailyFatalTrend = dailyFatalTrend;

    if (dateRange && dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const dateMap = new Map(
        dailyAuditsTrend.map((d: any) => [d.date, d.audits]),
      );
      const fatalDateMap = new Map(
        dailyFatalTrend.map((d: any) => [d.date, d.fatalErrors]),
      );

      filledDailyAuditsTrend = [];
      filledDailyFatalTrend = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        filledDailyAuditsTrend.push({
          date: dateStr,
          audits: dateMap.get(dateStr) || 0,
        });
        filledDailyFatalTrend.push({
          date: dateStr,
          fatalErrors: fatalDateMap.get(dateStr) || 0,
        });
      }
    }

    // --- Manual Parameter Grouping / Correction Logic ---
    // Fetch all active QA Parameters to build a map: SubParam -> GroupName
    // This allows us to rollup "orphaned" sub-parameters into their parent groups for cleaner charts.
    let topIssues: any[]; // Declare topIssues with let
    try {
      const allParams = await this.qaParameterModel
        .find({ isActive: true })
        .lean()
        .exec();
      const paramToGroupMap = new Map<string, string>();

      allParams.forEach((paramSet) => {
        if (paramSet.parameters && Array.isArray(paramSet.parameters)) {
          paramSet.parameters.forEach((group: any) => {
            // Map sub-parameters to group
            if (group.subParameters && Array.isArray(group.subParameters)) {
              group.subParameters.forEach((sub: any) => {
                if (sub.name)
                  paramToGroupMap.set(
                    sub.name.trim().toLowerCase(),
                    group.name,
                  );
              });
            }
            // Map group itself (if used directly)
            if (group.name)
              paramToGroupMap.set(group.name.trim().toLowerCase(), group.name);
          });
        }
      });

      // Filter and Re-Group Top Issues
      const rawTopIssues = (stats?.topIssues || []).filter((issue: any) => {
        const normalizedParam =
          issue.parameter?.toUpperCase().replace(/\s/g, '') || '';
        return normalizedParam !== 'FATAL/CRITICAL';
      });

      const groupedIssuesMap = new Map<
        string,
        {
          count: number;
          totalScore: number;
          criticalCount: number;
          type: string;
        }
      >();

      rawTopIssues.forEach((issue: any) => {
        const rawName = (issue.parameter || '').trim();
        // Lookup group name, fallback to raw name
        const groupName = paramToGroupMap.get(rawName.toLowerCase()) || rawName;

        const current = groupedIssuesMap.get(groupName) || {
          count: 0,
          totalScore: 0,
          criticalCount: 0,
          type: issue.type,
        };

        current.count += issue.count;
        current.totalScore += issue.totalScore || issue.avgScore * issue.count; // Use totalScore if projected, else approximate
        if (issue.critical) current.criticalCount++;
        // Maintain type if consistent, else maybe mix? Usually type follows group.
        groupedIssuesMap.set(groupName, current);
      });

      // Convert map back to array & sort
      const groupedTopIssues = Array.from(groupedIssuesMap.entries())
        .map(([name, data]) => ({
          parameter: name,
          count: data.count,
          avgScore:
            data.count > 0
              ? parseFloat((data.totalScore / data.count).toFixed(1))
              : 0,
          critical: data.criticalCount > 0,
          type: data.type,
        }))
        .sort((a, b) => b.count - a.count); // Sort desc by count

      // Apply Grouping to Training Needs
      // We need to regroup stats.trainingNeeds using paramToGroupMap
      const rawTrainingNeeds = stats?.trainingNeeds || [];
      const agentGroupedParams = new Map<
        string,
        { totalScore: number; count: number }
      >();

      rawTrainingNeeds.forEach((item: any) => {
        const rawParam = (item.param || '').trim();
        const groupName =
          paramToGroupMap.get(rawParam.toLowerCase()) || rawParam;
        const key = `${item.agentId}__${groupName}`; // Composite key: AgentID + GroupName

        const current = agentGroupedParams.get(key) || {
          totalScore: 0,
          count: 0,
        };
        current.totalScore += item.totalScore || item.avgScore * item.count;
        current.count += item.count;
        agentGroupedParams.set(key, current);
      });

      // Convert back to list format for processing
      const groupedTrainingNeeds = Array.from(agentGroupedParams.entries())
        .map(([key, data]) => {
          const [agentId, param] = key.split('__');
          // Find agent name from original list (inefficient but safe)
          const original = rawTrainingNeeds.find(
            (t: any) => t.agentId === agentId,
          );
          return {
            agentId,
            agentName: original?.agentName || 'Unknown',
            param,
            avgScore:
              data.count > 0
                ? parseFloat((data.totalScore / data.count).toFixed(1))
                : 0,
            count: data.count,
          };
        })
        .sort((a, b) => a.avgScore - b.avgScore); // Sort asc by score (lowest first)

      // Update trainingNeedsList variable
      const trainingNeedsList = groupedTrainingNeeds;

      primaryTrainingNeed =
        trainingNeedsList.length > 0
          ? {
            agentName: trainingNeedsList[0].agentName,
            lowestParam: trainingNeedsList[0].param,
          }
          : null;

      // Build training needs list for modal (bottom 5 agents by score)
      trainingNeedsForModal = underperformingAgents.map((agent: any) => {
        // Find worst parameter for this agent from GROUPED list
        const agentParams = trainingNeedsList.filter(
          (t: any) => t.agentId === agent.agentId,
        );
        // agentParams is already sorted by avgScore asc
        const worstParam = agentParams.length > 0 ? agentParams[0] : null;

        return {
          agentName: agent.agentName,
          agentId: agent.agentId,
          score: agent.avgScore,
          lowestParam: worstParam?.param || 'N/A',
          lowestParamScore: worstParam?.avgScore || 0,
        };
      });

      // Update the variables used for return
      topIssues = groupedTopIssues;
    } catch (e) {
      this.logger.error(
        `Failed to process parameter grouping: ${e.message}`,
        e.stack,
      );
      // Fallback to original if error
      topIssues = (stats?.topIssues || []).filter((issue: any) => {
        const normalizedParam =
          issue.parameter?.toUpperCase().replace(/\s/g, '') || '';
        return normalizedParam !== 'FATAL/CRITICAL';
      });
    }

    // Calculate Pareto data from (potentially grouped) top issues
    const totalFailures = topIssues.reduce(
      (sum: number, i: any) => sum + i.count,
      0,
    );
    let cumulative = 0;
    const paretoData = topIssues.slice(0, 15).map((issue: any) => {
      // Increased slice to 15 to match frontend
      const frequencyPercentage =
        totalFailures > 0 ? (issue.count / totalFailures) * 100 : 0;
      cumulative += issue.count;
      return {
        parameter: issue.parameter,
        count: issue.count,
        frequencyPercentage: parseFloat(frequencyPercentage.toFixed(1)),
        cumulative,
        percentage:
          totalFailures > 0
            ? parseFloat(((cumulative / totalFailures) * 100).toFixed(1))
            : 0,
      };
    });

    // Sentiment percentages
    const sentimentPercentages = {
      positive:
        totalAudits > 0
          ? parseFloat(
            ((sentimentData.positive / totalAudits) * 100).toFixed(1),
          )
          : 0,
      neutral:
        totalAudits > 0
          ? parseFloat(((sentimentData.neutral / totalAudits) * 100).toFixed(1))
          : 0,
      negative:
        totalAudits > 0
          ? parseFloat(
            ((sentimentData.negative / totalAudits) * 100).toFixed(1),
          )
          : 0,
    };

    return {
      // Overview metrics
      total: totalAudits,
      overallQAScore,
      avgScore: overallQAScore, // Alias for admin portal compatibility
      totalAudits,
      aiAudits: overview.aiAudits || 0,
      manualAudits: overview.manualAudits || 0,
      passRate,
      passCount: overview.passCount || 0,
      failRate: totalAudits > 0 ? 100 - passRate : 0,

      // Fatal errors
      fatalRate,
      totalFatalErrors: fatalData.totalFatalErrors || 0,
      fatalAuditsCount: fatalData.fatalAuditsCount || 0,

      // ZTP
      ztpCount: overview.ztpCount || 0,
      ztpRate,

      // Training needs
      trainingNeeds: primaryTrainingNeed,
      trainingNeedsList: trainingNeedsForModal,

      // Charts data
      dailyTrend: filledDailyAuditsTrend,
      dailyFatalTrend: filledDailyFatalTrend,
      // Use slice(0, 10) for charts as requested
      topFailingParams: topIssues.slice(0, 10).map((issue: any) => ({
        parameterName: issue.parameter,
        count: issue.count,
        critical: issue.critical,
        avgScore: issue.avgScore,
        type: issue.type,
      })),
      topIssues: topIssues.slice(0, 10).map((issue: any) => ({
        id: issue.parameter,
        reason: issue.parameter,
        count: issue.count,
        critical: issue.critical,
        avgScore: issue.avgScore,
        subParameters: [],
        suggestion: `Average score: ${issue.avgScore}%. Focus on improving this parameter.`,
      })),
      paretoData,

      // Performance data
      agentPerformance: {
        topAgents: topAgents.map((a: any) => ({
          id: a.agentId,
          name: a.agentName,
          score: a.avgScore,
          audits: a.audits,
          pass: a.pass,
          fail: a.fail,
        })),
        underperformingAgents: underperformingAgents.map((a: any) => ({
          id: a.agentId,
          name: a.agentName, // Use name instead of agentName for consistency
          agentName: a.agentName,
          score: a.avgScore,
          audits: a.audits,
          pass: a.pass,
          fail: a.fail,
          lowestParam: a.lowestParam,
          lowestParamScore: a.lowestParamScore,
        })),
      },
      campaignPerformance: (stats?.campaignPerformance || []).map((c: any) => ({
        name: c.name,
        avgScore: c.avgScore, // Keep avgScore for consistency
        score: c.avgScore, // Alias as score
        compliance: c.compliance,
        audits: c.audits,
      })),

      // Sentiment
      sentimentBreakdown: sentimentPercentages, // Keep old property name
      sentiment: sentimentPercentages, // New property name

      // Compliance data
      compliance: {
        violationCount: fatalData.fatalAuditsCount || 0, // Using fatal audits as proxy for violations if detailed violation data isn't in this facet
        avgScore: Math.round(100 - fatalRate), // Proxy calculation if avgComplianceScore isn't available
        interactionsWithIssues: fatalData.fatalAuditsCount || 0,
        totalAuditedInteractionsForCompliance: totalAudits,
        complianceRate:
          totalAudits > 0
            ? parseFloat(
              (
                ((totalAudits - fatalData.fatalAuditsCount) / totalAudits) *
                100
              ).toFixed(1),
            )
            : 0,
      },

      // Call metrics - aggregated from real audit data
      callMetrics: await this.getCallMetrics(match),
    };
  }

  /**
   * Aggregate real call metrics from audits
   */
  private async getCallMetrics(match: AuditFilter) {
    const defaults = {
      avgTalkRatio: 0,
      avgSilence: 0,
      avgResponseTime: 0,
      avgInterruptions: 0,
    };

    try {
      const [result] = await this.auditModel.aggregate([
        { $match: { ...match, metrics: { $exists: true } } },
        {
          $group: {
            _id: null,
            avgTalkRatio: { $avg: '$metrics.talkToListenRatio' },
            avgSilence: { $avg: '$metrics.silencePercentage' },
            avgHoldTime: { $avg: '$metrics.holdTime' },
            avgCallDuration: { $avg: '$metrics.callDuration' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (!result || result.count === 0) return defaults;

      return {
        avgTalkRatio: Math.round((result.avgTalkRatio || 0) * 10) / 10,
        avgSilence: Math.round((result.avgSilence || 0) * 10) / 10,
        avgResponseTime: Math.round((result.avgHoldTime || 0) * 10) / 10,
        avgInterruptions: Math.round((result.avgCallDuration || 0) * 10) / 10,
      };
    } catch (error) {
      this.logger.warn(`Failed to aggregate call metrics: ${error}`);
      return defaults;
    }
  }

  /**
   * Get agent performance leaderboard
   */
  async getLeaderboard(projectId?: string, limit = 10, organizationId?: string) {
    const match: AuditFilter = {};
    if (projectId) {
      match.projectId = new Types.ObjectId(projectId);
    }
    if (organizationId) {
      match.organizationId = new Types.ObjectId(organizationId);
    }

    return this.auditModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { agentUserId: '$agentUserId', agentName: '$agentName' },
          totalAudits: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
          passCount: {
            $sum: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          agentUserId: '$_id.agentUserId',
          agentName: '$_id.agentName',
          totalAudits: 1,
          avgScore: { $round: ['$avgScore', 2] },
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passCount', '$totalAudits'] }, 100] },
              2,
            ],
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
    const audit = await this.auditModel.findById(id).exec();
    if (!audit) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }

    // If part of a campaign, update campaign stats
    if (audit.campaignId) {
      await this.updateCampaignOnAuditDelete(audit.campaignId.toString(), id);
    }

    await this.auditModel.findByIdAndDelete(id).exec();
  }

  /**
   * Helper to update campaign stats when audit is deleted
   * Duplicates logic from CampaignService to avoid circular dependency
   */
  private async updateCampaignOnAuditDelete(
    campaignId: string,
    auditId: string,
  ): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) return;

    // Find job with this auditId
    const jobIndex = campaign.jobs.findIndex(
      (j) => j.auditId && j.auditId.toString() === auditId,
    );

    if (jobIndex > -1) {
      const job = campaign.jobs[jobIndex];

      // Update stats
      if (job.status === 'completed') {
        campaign.completedJobs = Math.max(0, campaign.completedJobs - 1);
      } else if (job.status === 'failed') {
        campaign.failedJobs = Math.max(0, campaign.failedJobs - 1);
      }

      // Reset job
      campaign.jobs[jobIndex].status = 'pending';
      campaign.jobs[jobIndex].auditId = undefined;
      (campaign.jobs[jobIndex] as any).error = undefined;

      // Update campaign status if it was completed
      if (campaign.status === 'completed' || campaign.status === 'failed') {
        campaign.status = 'processing';
      }

      await campaign.save();
      this.logger.log(
        `Audit ${auditId} deleted, reset job ${jobIndex} in campaign ${campaignId}`,
      );
    }
  }

  /**
   * Check for cached audit by audio hash
   */
  async findByAudioHash(
    audioHash: string,
    campaignName?: string,
  ): Promise<CallAudit | null> {
    const query: AuditFilter = { audioHash };
    if (campaignName) {
      query.campaignName = campaignName;
    }
    return this.auditModel.findOne(query).exec();
  }
}
