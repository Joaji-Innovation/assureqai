/**
 * Queue Worker Service
 * Processes bulk audit jobs from the queue with retry logic
 */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { join } from 'path';

import { QueueService, QueueJob } from './queue.service';
import { AiService } from '../ai/ai.service';
import { UsageReporterService } from '../audit-report/usage-reporter.service';
import { CallAudit, CallAuditDocument } from '../../database/schemas/call-audit.schema';
import { Campaign, CampaignDocument } from '../../database/schemas/campaign.schema';
import { QAParameter, QAParameterDocument } from '../../database/schemas/qa-parameter.schema';
import { LIMITS } from '@assureqai/common';

interface JobResult {
  success: boolean;
  auditId?: string;
  error?: string;
}

@Injectable()
export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkerService.name);
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly concurrency: number;
  private readonly pollIntervalMs: number;
  private activeJobs = 0;

  constructor(
    private configService: ConfigService,
    private queueService: QueueService,
    private aiService: AiService,
    private usageReporter: UsageReporterService,
    @InjectModel(CallAudit.name) private auditModel: Model<CallAuditDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(QAParameter.name) private qaParameterModel: Model<QAParameterDocument>,
  ) {
    // Configurable concurrency (number of parallel jobs)
    this.concurrency = this.configService.get<number>('QUEUE_CONCURRENCY') || 3;
    // Poll interval in ms
    this.pollIntervalMs = this.configService.get<number>('QUEUE_POLL_INTERVAL_MS') || 2000;
  }

  async onModuleInit() {
    // Only start worker if queue is available and not disabled
    const workerEnabled = this.configService.get<string>('QUEUE_WORKER_ENABLED') !== 'false';

    if (this.queueService.isAvailable() && workerEnabled) {
      this.startWorker();
      this.logger.log(`Queue worker started (concurrency: ${this.concurrency})`);
    } else {
      this.logger.warn('Queue worker disabled (Redis not available or QUEUE_WORKER_ENABLED=false)');
    }
  }

  async onModuleDestroy() {
    this.stopWorker();
  }

  /**
   * Start the worker loop
   */
  private startWorker() {
    this.isRunning = true;
    this.processingInterval = setInterval(() => this.processQueue(), this.pollIntervalMs);
  }

  /**
   * Stop the worker loop
   */
  private stopWorker() {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process jobs from queue
   */
  private async processQueue() {
    if (!this.isRunning) return;

    // Process up to concurrency limit
    while (this.activeJobs < this.concurrency) {
      const job = await this.queueService.getNextJob();
      if (!job) break;

      this.activeJobs++;
      this.processJob(job)
        .catch((err) => this.logger.error(`Job processing error: ${err}`))
        .finally(() => {
          this.activeJobs--;
        });
    }
  }

  /**
   * Process a single job with retry logic
   */
  private async processJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processing job ${job.id} (attempt ${job.attempts + 1})`);

    try {
      // Update campaign job status to processing
      await this.updateCampaignJobStatus(job.campaignId, job, 'processing');

      // Fetch the QA parameter set
      const qaParameterSet = await this.qaParameterModel.findById(job.parameterId).exec();
      if (!qaParameterSet) {
        throw new Error(`QA Parameter set ${job.parameterId} not found`);
      }

      // Transcribe audio (or use mock for dev)
      const { transcript, language } = await this.transcribeAudio(job.audioUrl);

      // Perform AI audit
      const auditResult = await this.aiService.auditCall({
        transcript,
        parameters: qaParameterSet.parameters,
        language,
      });

      // Save audit to database
      const audit = await this.saveAudit(job, qaParameterSet, transcript, auditResult);

      // Update campaign with success
      await this.updateCampaignJobStatus(job.campaignId, job, 'completed', audit._id.toString());

      const duration = Date.now() - startTime;
      this.logger.log(`Job ${job.id} completed in ${duration}ms, score: ${auditResult.overallScore}`);

      // Cleanup audio file
      await this.deleteAudioFile(job.audioUrl);

      // Report usage to admin panel (for isolated instances)
      this.usageReporter.reportAudit({
        auditId: audit._id.toString(),
        agentName: job.agentName,
        callId: job.callId,
        auditType: 'bulk',
        overallScore: auditResult.overallScore,
        maxPossibleScore: 100,
        processingDurationMs: duration,
        inputTokens: auditResult.tokenUsage?.inputTokens || 0,
        outputTokens: auditResult.tokenUsage?.outputTokens || 0,
        totalTokens: auditResult.tokenUsage?.totalTokens || 0,
        parametersCount: qaParameterSet.parameters.length,
        sentiment: auditResult.sentiment,
        passStatus: auditResult.overallScore >= 70 ? 'pass' : 'fail',
      }).catch(() => { }); // Fire and forget

      // Check if campaign is complete
      await this.checkCampaignCompletion(job.campaignId);

    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      this.logger.warn(`Job ${job.id} failed (attempt ${job.attempts + 1}): ${errorMessage}`);

      // Calculate retry delay with exponential backoff
      const retryDelay = this.calculateRetryDelay(job.attempts);

      if (job.attempts + 1 < LIMITS.MAX_RETRIES) {
        // Schedule retry with exponential backoff
        this.logger.log(`Scheduling retry for job ${job.id} in ${retryDelay}ms`);

        setTimeout(async () => {
          await this.queueService.returnJob(job);
        }, retryDelay);
      } else {
        // Max retries exceeded - mark as failed
        this.logger.error(`Job ${job.id} failed permanently after ${job.attempts + 1} attempts`);
        await this.updateCampaignJobStatus(job.campaignId, job, 'failed', undefined, errorMessage);
        await this.checkCampaignCompletion(job.campaignId);
      }
    }
  }

  /**
   * Delete audio file from local storage
   */
  private async deleteAudioFile(audioUrl: string): Promise<void> {
    try {
      // Extract filename from URL (assumes /api/uploads/filename format)
      const filename = audioUrl.split('/uploads/').pop();
      if (!filename) return;

      const filepath = join(process.cwd(), 'uploads', filename);

      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        this.logger.log(`Deleted audio file: ${filename}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete audio file ${audioUrl}: ${error}`);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempts: number): number {
    const baseDelay = LIMITS.RETRY_DELAY_MS || 1000;
    const multiplier = LIMITS.RETRY_BACKOFF_MULTIPLIER || 2;
    const maxDelay = 60000; // Max 1 minute

    const delay = baseDelay * Math.pow(multiplier, attempts);
    return Math.min(delay, maxDelay);
  }

  /**
   * Transcribe audio (placeholder - would integrate with Speech-to-Text)
   */
  private async transcribeAudio(audioUrl: string): Promise<{ transcript: string; language: string }> {
    // TODO: Integrate with Google Speech-to-Text or similar
    // For now, return mock data in development
    if (process.env.NODE_ENV !== 'production') {
      return {
        transcript: `[SIMULATED TRANSCRIPT for ${audioUrl}]
Agent: Thank you for calling, how may I help you today?
Customer: I have an issue with my order.
Agent: I'd be happy to help you with that. Can you provide your order number?
Customer: Yes, it's 12345.
Agent: Thank you. I can see your order. What seems to be the issue?
Customer: The item arrived damaged.
Agent: I'm sorry to hear that. We'll send a replacement right away.
Customer: Thank you for your help.
Agent: You're welcome. Is there anything else I can help with?
Customer: No, that's all.
Agent: Thank you for calling. Have a great day!`,
        language: 'en-US',
      };
    }

    throw new Error('Audio transcription not yet implemented for production');
  }

  /**
   * Save audit to database
   */
  private async saveAudit(
    job: QueueJob,
    qaParameterSet: QAParameterDocument,
    transcript: string,
    auditResult: any,
  ): Promise<CallAuditDocument> {
    const audit = new this.auditModel({
      callId: job.callId || `bulk-${job.id}`,
      agentName: job.agentName || 'Unknown',
      campaignId: new Types.ObjectId(job.campaignId),
      qaParameterSetId: qaParameterSet._id,
      transcript,
      overallScore: auditResult.overallScore,
      maxPossibleScore: 100,
      auditResults: auditResult.auditResults.map((r: any) => ({
        parameterId: r.parameterId,
        parameterName: r.parameterName,
        score: r.score,
        maxScore: r.weight,
        comments: r.comments,
        type: r.type,
        confidence: r.confidence,
        evidence: r.evidence,
      })),
      sentiment: auditResult.sentiment,
      callSummary: auditResult.callSummary,
      tokenUsage: auditResult.tokenUsage,
      auditDurationMs: auditResult.timing?.processingDurationMs || 0,
      auditType: 'bulk',
      status: 'completed',
    });

    return audit.save();
  }

  /**
   * Update campaign job status
   */
  private async updateCampaignJobStatus(
    campaignId: string,
    job: QueueJob,
    status: 'processing' | 'completed' | 'failed',
    auditId?: string,
    error?: string,
  ): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) return;

    // Find job index by audioUrl and callId
    const jobIndex = campaign.jobs.findIndex(
      (j) => j.audioUrl === job.audioUrl && j.callId === job.callId,
    );

    if (jobIndex === -1) return;

    const update: Record<string, any> = {
      [`jobs.${jobIndex}.status`]: status,
    };

    if (status === 'processing') {
      update.$inc = { processingJobs: 1 };
    } else if (status === 'completed') {
      update.$inc = { completedJobs: 1, processingJobs: -1 };
      if (auditId) {
        update[`jobs.${jobIndex}.auditId`] = new Types.ObjectId(auditId);
      }
    } else if (status === 'failed') {
      update.$inc = { failedJobs: 1, processingJobs: -1 };
      if (error) {
        update[`jobs.${jobIndex}.error`] = error;
      }
    }

    await this.campaignModel.findByIdAndUpdate(campaignId, update).exec();
  }

  /**
   * Check if campaign is complete and update status
   */
  private async checkCampaignCompletion(campaignId: string): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) return;

    const processedJobs = campaign.completedJobs + campaign.failedJobs;

    if (processedJobs >= campaign.totalJobs) {
      // Calculate stats
      const audits = await this.auditModel
        .find({ campaignId: new Types.ObjectId(campaignId) })
        .exec();

      const stats = {
        avgScore: audits.length > 0
          ? audits.reduce((sum, a) => sum + a.overallScore, 0) / audits.length
          : 0,
        totalTokens: audits.reduce((sum, a) => sum + (a.tokenUsage?.totalTokens || 0), 0),
        avgDurationMs: audits.length > 0
          ? audits.reduce((sum, a) => sum + (a.auditDurationMs || 0), 0) / audits.length
          : 0,
      };

      await this.campaignModel.findByIdAndUpdate(campaignId, {
        status: campaign.failedJobs === campaign.totalJobs ? 'failed' : 'completed',
        completedAt: new Date(),
        processingJobs: 0,
        stats,
      }).exec();

      this.logger.log(
        `Campaign ${campaignId} completed: ${campaign.completedJobs} succeeded, ${campaign.failedJobs} failed`,
      );
    }
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs,
      concurrency: this.concurrency,
    };
  }

  /**
   * Manually retry failed jobs for a campaign
   */
  async retryFailedJobs(campaignId: string): Promise<number> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    let retriedCount = 0;

    for (let i = 0; i < campaign.jobs.length; i++) {
      const job = campaign.jobs[i];
      if (job.status === 'failed') {
        await this.queueService.addJob({
          campaignId,
          audioUrl: job.audioUrl,
          agentName: job.agentName,
          callId: job.callId,
          parameterId: campaign.qaParameterSetId.toString(),
        });

        // Reset job status
        await this.campaignModel.findByIdAndUpdate(campaignId, {
          [`jobs.${i}.status`]: 'pending',
          [`jobs.${i}.error`]: null,
          $inc: { failedJobs: -1 },
        }).exec();

        retriedCount++;
      }
    }

    // Update campaign status
    if (retriedCount > 0) {
      await this.campaignModel.findByIdAndUpdate(campaignId, {
        status: 'processing',
      }).exec();
    }

    this.logger.log(`Retried ${retriedCount} failed jobs for campaign ${campaignId}`);
    return retriedCount;
  }
}
