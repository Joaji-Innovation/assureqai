/**
 * Usage Tracking Service
 * Resolves the Instance by INSTANCE_API_KEY on startup and tracks all API calls.
 * Uses batched writes (flushes every 30s) to avoid hammering the DB on every request.
 */
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Instance,
  InstanceDocument,
} from '../../database/schemas/instance.schema';

@Injectable()
export class UsageTrackingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsageTrackingService.name);

  /** Resolved once on startup — null if no API key configured */
  private instanceId: string | null = null;

  /** In-memory counter, flushed to DB periodically */
  private pendingApiCalls = 0;

  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 30_000; // 30 seconds

  constructor(
    private configService: ConfigService,
    @InjectModel(Instance.name) private instanceModel: Model<InstanceDocument>,
  ) {}

  async onModuleInit() {
    const apiKey = this.configService.get<string>('INSTANCE_API_KEY');
    if (!apiKey) {
      this.logger.warn('INSTANCE_API_KEY not set — usage tracking disabled');
      return;
    }

    const instance = await this.instanceModel
      .findOne({ apiKey })
      .select('_id name')
      .exec();

    if (instance) {
      this.instanceId = instance._id.toString();
      this.logger.log(
        `Usage tracking enabled for instance "${instance.name}" (${this.instanceId})`,
      );
    } else {
      this.logger.warn(
        'INSTANCE_API_KEY set but no matching Instance found — usage tracking disabled',
      );
      return;
    }

    // Start periodic flush
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => this.logger.error('Usage flush failed', err));
    }, this.FLUSH_INTERVAL_MS);
  }

  async onModuleDestroy() {
    // Flush remaining counts before shutdown
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }

  // ─── Public API ───────────────────────────────────────────

  /** Whether tracking is active (API key resolved to an instance) */
  get isEnabled(): boolean {
    return this.instanceId !== null;
  }

  /** The resolved instance ID (null if tracking disabled) */
  getInstanceId(): string | null {
    return this.instanceId;
  }

  /** Increment the API-call counter (non-blocking, batched) */
  trackApiCall(): void {
    if (this.instanceId) {
      this.pendingApiCalls++;
    }
  }

  // ─── Internal ─────────────────────────────────────────────

  /** Flush the in-memory counter to MongoDB */
  private async flush(): Promise<void> {
    if (this.pendingApiCalls === 0 || !this.instanceId) return;

    const count = this.pendingApiCalls;
    this.pendingApiCalls = 0;

    await this.instanceModel
      .updateOne(
        { _id: this.instanceId },
        { $inc: { 'credits.totalApiCalls': count } },
      )
      .exec();

    this.logger.debug(
      `Flushed ${count} API calls for instance ${this.instanceId}`,
    );
  }
}
