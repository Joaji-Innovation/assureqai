/**
 * Credits Service - Credit management for instances
 * Includes configurable token-to-credit conversion
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Credits,
  CreditsDocument,
} from '../../database/schemas/credits.schema';
import {
  CreditTransaction,
  CreditTransactionDocument,
} from '../../database/schemas/credit-transaction.schema';
import {
  Instance,
  InstanceDocument,
} from '../../database/schemas/instance.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SettingsService } from '../settings/settings.service';

/** Default fallback if Settings has no value or value is invalid */
const DEFAULT_TOKEN_TO_CREDIT_RATE = 2000;

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    @InjectModel(Credits.name) private creditsModel: Model<CreditsDocument>,
    @InjectModel(CreditTransaction.name)
    private transactionModel: Model<CreditTransactionDocument>,
    @InjectModel(Instance.name) private instanceModel: Model<InstanceDocument>,
    private eventEmitter: EventEmitter2,
    private settingsService: SettingsService,
  ) { }

  /**
   * Initialize credits for a new instance
   */
  async initializeCredits(
    instanceId: string,
    options: {
      instanceType?: 'trial' | 'standard' | 'enterprise';
      auditCredits?: number;
      tokenCredits?: number;
      trialDays?: number;
      createdBy?: string;
    } = {},
  ): Promise<Credits> {
    const existing = await this.creditsModel.findOne({
      instanceId: new Types.ObjectId(instanceId),
    });
    if (existing) {
      return existing;
    }

    const trialExpiresAt =
      options.instanceType === 'trial' && options.trialDays
        ? new Date(Date.now() + options.trialDays * 24 * 60 * 60 * 1000)
        : undefined;

    const credits = await this.creditsModel.create({
      instanceId: new Types.ObjectId(instanceId),
      instanceType: options.instanceType || 'trial',
      auditCredits: options.auditCredits || 100,
      totalAuditCreditsAllocated: options.auditCredits || 100,
      tokenCredits: options.tokenCredits || 50000,
      totalTokenCreditsAllocated: options.tokenCredits || 50000,
      trialExpiresAt,
      lastUpdatedBy: options.createdBy,
    });

    // Log initial allocation
    await this.logTransaction(instanceId, {
      type: 'add',
      creditType: 'audit',
      amount: options.auditCredits || 100,
      balanceAfter: options.auditCredits || 100,
      reason: 'Initial allocation',
      createdBy: options.createdBy,
    });

    await this.logTransaction(instanceId, {
      type: 'add',
      creditType: 'token',
      amount: options.tokenCredits || 50000,
      balanceAfter: options.tokenCredits || 50000,
      reason: 'Initial allocation',
      createdBy: options.createdBy,
    });

    return credits;
  }

  /**
   * Get credits for an instance
   */
  async getByInstance(instanceId: string): Promise<Credits> {
    const credits = await this.creditsModel.findOne({
      instanceId: new Types.ObjectId(instanceId),
    });
    if (!credits) {
      throw new NotFoundException(
        `Credits not found for instance ${instanceId}`,
      );
    }
    return credits;
  }

  /**
   * Add audit credits (Admin only)
   */
  async addAuditCredits(
    instanceId: string,
    amount: number,
    reason: string,
    addedBy: string,
  ): Promise<Credits> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const credits = await this.creditsModel
      .findOneAndUpdate(
        { instanceId: new Types.ObjectId(instanceId) },
        {
          $inc: { auditCredits: amount, totalAuditCreditsAllocated: amount },
          $set: { lowCreditAlertSent: false, lastUpdatedBy: addedBy },
        },
        { new: true },
      )
      .exec();

    if (!credits) {
      throw new NotFoundException(
        `Credits not found for instance ${instanceId}`,
      );
    }

    await this.logTransaction(instanceId, {
      type: 'add',
      creditType: 'audit',
      amount,
      balanceAfter: credits.auditCredits,
      reason,
      createdBy: addedBy,
    });

    return credits;
  }

  /**
   * Add token credits (Admin only)
   */
  async addTokenCredits(
    instanceId: string,
    amount: number,
    reason: string,
    addedBy: string,
  ): Promise<Credits> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const credits = await this.creditsModel
      .findOneAndUpdate(
        { instanceId: new Types.ObjectId(instanceId) },
        {
          $inc: { tokenCredits: amount, totalTokenCreditsAllocated: amount },
          $set: { lowCreditAlertSent: false, lastUpdatedBy: addedBy },
        },
        { new: true },
      )
      .exec();

    if (!credits) {
      throw new NotFoundException(
        `Credits not found for instance ${instanceId}`,
      );
    }

    await this.logTransaction(instanceId, {
      type: 'add',
      creditType: 'token',
      amount,
      balanceAfter: credits.tokenCredits,
      reason,
      createdBy: addedBy,
    });

    return credits;
  }

  /**
   * Use audit credits (called when audit is performed)
   */
  async useAuditCredits(
    instanceId: string,
    amount = 1,
    reference?: string,
  ): Promise<{ success: boolean; remaining: number }> {
    const current = await this.getByInstance(instanceId);

    if (current.auditCredits < amount && current.blockOnExhausted) {
      return { success: false, remaining: current.auditCredits };
    }

    const newBalance = Math.max(0, current.auditCredits - amount);
    const credits = await this.creditsModel
      .findOneAndUpdate(
        { instanceId: new Types.ObjectId(instanceId) },
        {
          $set: { auditCredits: newBalance },
          $inc: { auditCreditsUsed: amount },
        },
        { new: true },
      )
      .exec();

    // Sync to Instance collection for admin panel visibility
    await this.instanceModel
      .findByIdAndUpdate(instanceId, {
        $inc: { 'credits.usedAudits': amount },
      })
      .exec();

    await this.logTransaction(instanceId, {
      type: 'use',
      creditType: 'audit',
      amount: -amount,
      balanceAfter: newBalance,
      reason: 'Audit performed',
      reference,
    });

    await this.checkLowCreditAlert(instanceId);
    return { success: true, remaining: newBalance };
  }

  /**
   * Get the current token-to-credit conversion rate from Settings.
   * Falls back to DEFAULT_TOKEN_TO_CREDIT_RATE if not configured or invalid.
   */
  private async getTokenToCreditRate(): Promise<number> {
    try {
      const settings = await this.settingsService.getSettings();
      const rate = settings?.tokenToCreditRate;
      if (rate && typeof rate === 'number' && rate > 0) {
        return rate;
      }
    } catch (err) {
      this.logger.warn(`Failed to read tokenToCreditRate from settings: ${err}`);
    }
    return DEFAULT_TOKEN_TO_CREDIT_RATE;
  }

  /**
   * Use token credits (called during AI processing).
   *
   * Also implements the token-to-credit conversion:
   * Every `tokenToCreditRate` tokens consumed = 1 audit credit deducted.
   * The accumulator `tokensTowardsNextCredit` tracks partial progress.
   */
  async useTokenCredits(
    instanceId: string,
    amount: number,
    reference?: string,
  ): Promise<{ success: boolean; remaining: number; creditsConsumed?: number }> {
    if (amount <= 0) {
      return { success: true, remaining: 0 };
    }

    const current = await this.getByInstance(instanceId);

    // Check if token credits are available (if blocking is enabled)
    if (current.tokenCredits < amount && current.blockOnExhausted) {
      return { success: false, remaining: current.tokenCredits };
    }

    // --- Step 1: Deduct token credits and increment the accumulator atomically ---
    const newTokenBalance = Math.max(0, current.tokenCredits - amount);
    const updatedCredits = await this.creditsModel
      .findOneAndUpdate(
        { instanceId: new Types.ObjectId(instanceId) },
        {
          $set: { tokenCredits: newTokenBalance },
          $inc: {
            tokenCreditsUsed: amount,
            tokensTowardsNextCredit: amount,
          },
        },
        { new: true },
      )
      .exec();

    // Sync to Instance collection for admin panel visibility
    await this.instanceModel
      .findByIdAndUpdate(instanceId, {
        $inc: { 'credits.usedTokens': amount },
      })
      .exec();

    // Log the token usage transaction
    await this.logTransaction(instanceId, {
      type: 'use',
      creditType: 'token',
      amount: -amount,
      balanceAfter: newTokenBalance,
      reason: 'AI tokens consumed',
      reference,
    });

    // --- Step 2: Check if accumulated tokens have crossed the threshold ---
    let creditsConsumed = 0;
    if (updatedCredits && updatedCredits.tokensTowardsNextCredit > 0) {
      const rate = await this.getTokenToCreditRate();
      const accumulated = updatedCredits.tokensTowardsNextCredit;

      if (accumulated >= rate) {
        creditsConsumed = Math.floor(accumulated / rate);
        const remainder = accumulated % rate;

        // Atomically deduct audit credits and reset the accumulator
        const afterConversion = await this.creditsModel
          .findOneAndUpdate(
            { instanceId: new Types.ObjectId(instanceId) },
            {
              $inc: {
                auditCredits: -creditsConsumed,
                auditCreditsUsed: creditsConsumed,
              },
              $set: { tokensTowardsNextCredit: remainder },
            },
            { new: true },
          )
          .exec();

        // Sync audit credit usage to Instance
        await this.instanceModel
          .findByIdAndUpdate(instanceId, {
            $inc: { 'credits.usedAudits': creditsConsumed },
          })
          .exec();

        // Log the conversion transaction
        await this.logTransaction(instanceId, {
          type: 'token_conversion',
          creditType: 'audit',
          amount: -creditsConsumed,
          balanceAfter: afterConversion?.auditCredits ?? 0,
          reason: `Token-to-credit conversion (${creditsConsumed} credits for ${creditsConsumed * rate} tokens at rate ${rate})`,
          reference,
        });

        this.logger.log(
          `Token-to-credit conversion: ${creditsConsumed} audit credit(s) deducted ` +
          `for instance ${instanceId} (rate: ${rate}, remainder: ${remainder})`,
        );

        // Prevent audit credits from going negative — clamp at 0
        if (afterConversion && afterConversion.auditCredits < 0) {
          await this.creditsModel
            .findOneAndUpdate(
              { instanceId: new Types.ObjectId(instanceId) },
              { $set: { auditCredits: 0 } },
            )
            .exec();
        }
      }
    }

    await this.checkLowCreditAlert(instanceId);
    return { success: true, remaining: newTokenBalance, creditsConsumed };
  }

  /**
   * Update instance type (e.g., trial -> standard)
   */
  async updateInstanceType(
    instanceId: string,
    instanceType: 'trial' | 'standard' | 'enterprise',
    updatedBy: string,
  ): Promise<Credits> {
    const updateData: any = {
      instanceType,
      lastUpdatedBy: updatedBy,
    };
    if (instanceType !== 'trial') {
      updateData.trialExpiresAt = null;
    }

    const credits = await this.creditsModel
      .findOneAndUpdate(
        { instanceId: new Types.ObjectId(instanceId) },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!credits) {
      throw new NotFoundException(
        `Credits not found for instance ${instanceId}`,
      );
    }
    return credits;
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    instanceId: string,
    options?: {
      creditType?: 'audit' | 'token';
      limit?: number;
      skip?: number;
    },
  ): Promise<CreditTransaction[]> {
    const query: any = { instanceId: new Types.ObjectId(instanceId) };
    if (options?.creditType) {
      query.creditType = options.creditType;
    }

    return this.transactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .exec();
  }

  /**
   * Get usage summary for an instance
   */
  async getUsageSummary(instanceId: string): Promise<{
    auditCredits: {
      balance: number;
      used: number;
      total: number;
      percentage: number;
    };
    tokenCredits: {
      balance: number;
      used: number;
      total: number;
      percentage: number;
    };
    instanceType: string;
    trialExpiresAt?: Date;
    isTrialExpired: boolean;
  }> {
    const credits = await this.getByInstance(instanceId);

    const auditPercentage =
      credits.totalAuditCreditsAllocated > 0
        ? Math.round(
          (credits.auditCredits / credits.totalAuditCreditsAllocated) * 100,
        )
        : 0;

    const tokenPercentage =
      credits.totalTokenCreditsAllocated > 0
        ? Math.round(
          (credits.tokenCredits / credits.totalTokenCreditsAllocated) * 100,
        )
        : 0;

    const isTrialExpired =
      credits.instanceType === 'trial' &&
      credits.trialExpiresAt &&
      new Date() > credits.trialExpiresAt;

    return {
      auditCredits: {
        balance: credits.auditCredits,
        used: credits.auditCreditsUsed,
        total: credits.totalAuditCreditsAllocated,
        percentage: auditPercentage,
      },
      tokenCredits: {
        balance: credits.tokenCredits,
        used: credits.tokenCreditsUsed,
        total: credits.totalTokenCreditsAllocated,
        percentage: tokenPercentage,
      },
      instanceType: credits.instanceType,
      trialExpiresAt: credits.trialExpiresAt,
      isTrialExpired,
    };
  }

  /**
   * Check and send low credit alert
   */
  private async checkLowCreditAlert(instanceId: string): Promise<void> {
    const credits = await this.getByInstance(instanceId);

    if (credits.lowCreditAlertSent) return;

    const auditPercentage =
      credits.totalAuditCreditsAllocated > 0
        ? (credits.auditCredits / credits.totalAuditCreditsAllocated) * 100
        : 100;

    if (auditPercentage <= credits.lowCreditAlertThreshold) {
      await this.creditsModel
        .findOneAndUpdate(
          { instanceId: new Types.ObjectId(instanceId) },
          { $set: { lowCreditAlertSent: true } },
        )
        .exec();

      this.logger.warn(
        `Low credit alert triggered for instance ${instanceId} (${auditPercentage.toFixed(1)}% remaining)`,
      );
      this.eventEmitter.emit('alert.created', {
        alert: {
          type: 'low_credits',
          severity: 'warning',
          title: 'Low Audit Credits',
          message: `Audit credits are running low (${auditPercentage.toFixed(0)}% remaining). Please add more credits to avoid interruption.`,
          instanceId,
        },
      });
    }
  }

  /**
   * Log a credit transaction
   */
  private async logTransaction(
    instanceId: string,
    data: {
      type: 'add' | 'use' | 'expire' | 'refund' | 'adjust' | 'purchase' | 'token_conversion';
      creditType: 'audit' | 'token';
      amount: number;
      balanceAfter: number;
      reason: string;
      reference?: string;
      createdBy?: string;
    },
  ): Promise<void> {
    await this.transactionModel.create({
      instanceId: new Types.ObjectId(instanceId),
      ...data,
    });
  }
}
