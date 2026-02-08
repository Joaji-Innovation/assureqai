/**
 * Campaign Service
 * Manages bulk audit campaigns/jobs
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from '../../database/schemas/campaign.schema';
import { QueueService } from '../queue/queue.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';
import { PaginatedResult, LIMITS } from '@assureqai/common';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private queueService: QueueService,
  ) { }

  /**
   * Create a new campaign and queue jobs
   */
  async create(dto: CreateCampaignDto, userId: string): Promise<Campaign> {
    // Validate job count
    if (dto.jobs.length > LIMITS.MAX_BULK_ROWS) {
      throw new BadRequestException(
        `Maximum ${LIMITS.MAX_BULK_ROWS} jobs allowed per campaign`,
      );
    }

    // Create campaign record
    const campaign = new this.campaignModel({
      name: dto.name,
      description: dto.description,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      qaParameterSetId: new Types.ObjectId(dto.qaParameterSetId),
      createdBy: new Types.ObjectId(userId),
      status: 'pending',
      totalJobs: dto.jobs.length,
      completedJobs: 0,
      failedJobs: 0,
      jobs: dto.jobs.map((job) => ({
        audioUrl: job.audioUrl,
        agentName: job.agentName,
        callId: job.callId,
        status: 'pending',
      })),
      applyRateLimit: dto.applyRateLimit ?? true,
    });

    await campaign.save();

    // Queue jobs if Redis is available
    if (this.queueService.isAvailable()) {
      try {
        await this.queueService.addJobs(
          dto.jobs.map((job) => ({
            campaignId: campaign._id.toString(),
            audioUrl: job.audioUrl,
            agentName: job.agentName,
            callId: job.callId,
            parameterId: dto.qaParameterSetId,
          })),
        );

        // Update status to processing
        campaign.status = 'processing';
        campaign.startedAt = new Date();
        await campaign.save();

        this.logger.log(`Campaign ${campaign._id} started with ${dto.jobs.length} jobs`);
      } catch (error) {
        this.logger.error(`Failed to queue jobs: ${error}`);
      }
    } else {
      this.logger.warn('Redis not available, jobs not queued');
    }

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  /**
   * Get campaigns with pagination
   */
  async findAll(
    projectId?: string,
    page = 1,
    limit = LIMITS.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<Campaign>> {
    const query: Record<string, any> = {};
    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.campaignModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.campaignModel.countDocuments(query).exec(),
    ]);

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
   * Update job status within campaign
   */
  async updateJobStatus(
    campaignId: string,
    jobIndex: number,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    auditId?: string,
    error?: string,
  ): Promise<void> {
    const update: Record<string, any> = {
      [`jobs.${jobIndex}.status`]: status,
    };

    if (status === 'completed') {
      update.$inc = { completedJobs: 1 };
      if (auditId) {
        update[`jobs.${jobIndex}.auditId`] = new Types.ObjectId(auditId);
      }
    } else if (status === 'failed') {
      update.$inc = { failedJobs: 1 };
      if (error) {
        update[`jobs.${jobIndex}.error`] = error;
      }
    }

    await this.campaignModel.findByIdAndUpdate(campaignId, update).exec();
  }

  /**
   * Complete campaign
   */
  async complete(campaignId: string, stats?: Campaign['stats']): Promise<void> {
    const campaign = await this.findById(campaignId);

    const allCompleted = campaign.completedJobs + campaign.failedJobs >= campaign.totalJobs;
    if (allCompleted) {
      await this.campaignModel.findByIdAndUpdate(campaignId, {
        status: campaign.failedJobs === campaign.totalJobs ? 'failed' : 'completed',
        completedAt: new Date(),
        ...(stats && { stats }),
      }).exec();
    }
  }

  /**
   * Cancel campaign
   */
  async cancel(id: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true },
    ).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  /**
   * Delete campaign
   */
  async delete(id: string): Promise<void> {
    const result = await this.campaignModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
  }
  /**
   * Add a single job to an existing campaign and queue it immediately
   */
  async addJob(
    campaignId: string,
    job: { audioUrl: string; agentName?: string; callId?: string },
  ): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const newJob = {
      audioUrl: job.audioUrl,
      agentName: job.agentName,
      callId: job.callId,
      status: 'pending',
    };

    campaign.jobs.push(newJob as any);
    campaign.totalJobs += 1;

    // If campaign was completed/failed, set back to processing? 
    // Usually we add jobs to a new/pending/processing campaign.
    if (campaign.status === 'completed' || campaign.status === 'failed') {
      campaign.status = 'processing';
    }

    await campaign.save();

    // Queue job
    if (this.queueService.isAvailable()) {
      try {
        await this.queueService.addJobs([
          {
            campaignId: campaign._id.toString(),
            audioUrl: job.audioUrl,
            agentName: job.agentName,
            callId: job.callId,
            parameterId: campaign.qaParameterSetId.toString(),
          },
        ]);
        this.logger.log(`Added and queued job for campaign ${campaignId}`);
      } catch (error) {
        this.logger.error(`Failed to queue job: ${error}`);
      }
    }

    return campaign;
  }
}
