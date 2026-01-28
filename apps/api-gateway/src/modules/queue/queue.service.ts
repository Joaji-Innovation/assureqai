/**
 * Queue Service
 * Redis-based job queue for bulk audit processing
 * Uses ioredis directly for simplicity
 */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LIMITS } from '@assureqai/common';

export interface QueueJob {
  id: string;
  campaignId: string;
  audioUrl: string;
  agentName?: string;
  callId?: string;
  parameterId: string;
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private readonly logger = new Logger(QueueService.name);
  private readonly queueName = 'audit:jobs';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.logger.log('Redis connected for queue');
      } catch (error) {
        this.logger.warn('Redis not available, queue disabled');
      }
    } else {
      this.logger.warn('REDIS_URL not configured, queue disabled');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Add job to queue
   */
  async addJob(job: Omit<QueueJob, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    if (!this.redis) {
      throw new Error('Redis not available');
    }

    const id = `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const fullJob: QueueJob = {
      ...job,
      id,
      attempts: 0,
      createdAt: new Date(),
    };

    await this.redis.lpush(this.queueName, JSON.stringify(fullJob));
    return id;
  }

  /**
   * Add multiple jobs to queue
   */
  async addJobs(jobs: Omit<QueueJob, 'id' | 'attempts' | 'createdAt'>[]): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      const id = await this.addJob(job);
      ids.push(id);
    }
    return ids;
  }

  /**
   * Get next job from queue
   */
  async getNextJob(): Promise<QueueJob | null> {
    if (!this.redis) {
      return null;
    }

    const data = await this.redis.rpop(this.queueName);
    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Return job to queue (for retry)
   */
  async returnJob(job: QueueJob): Promise<void> {
    if (!this.redis) {
      return;
    }

    job.attempts += 1;
    if (job.attempts < LIMITS.MAX_RETRIES) {
      await this.redis.lpush(this.queueName, JSON.stringify(job));
    } else {
      // Move to failed queue
      await this.redis.lpush(`${this.queueName}:failed`, JSON.stringify(job));
    }
  }

  /**
   * Get queue length
   */
  async getQueueLength(): Promise<number> {
    if (!this.redis) {
      return 0;
    }
    return this.redis.llen(this.queueName);
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null;
  }
}
