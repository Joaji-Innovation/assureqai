/**
 * Payment Service - Handles credit purchases via Dodo Payments
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentDocument,
} from '../../database/schemas/payment.schema';
import {
  Organization,
  OrganizationDocument,
} from '../../database/schemas/organization.schema';
import { CreditsService } from '../credits/credits.service';
import { CreditPlanService } from '../credit-plan/credit-plan.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly dodoApiUrl: string;
  private readonly dodoApiKey: string;
  private readonly dodoWebhookSecret: string;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    private configService: ConfigService,
    private creditsService: CreditsService,
    private creditPlanService: CreditPlanService,
  ) {
    const env = this.configService.get<string>('DODO_ENV', 'test');
    this.dodoApiUrl =
      env === 'live'
        ? 'https://live.dodopayments.com'
        : 'https://test.dodopayments.com';
    this.dodoApiKey = this.configService.get<string>('DODO_API_KEY', '');
    this.dodoWebhookSecret = this.configService.get<string>(
      'DODO_WEBHOOK_SECRET',
      '',
    );
  }

  /**
   * Create a checkout session for purchasing credits
   */
  async createCheckoutSession(
    organizationId: string,
    userId: string,
    data: {
      planId?: string;
      returnUrl: string;
    },
  ): Promise<{ checkoutUrl: string; paymentId: string }> {
    // Get the organization
    const org = await this.organizationModel.findById(organizationId);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Get the plan
    let plan: any;
    if (data.planId) {
      plan = await this.creditPlanService.findById(data.planId);
    } else {
      // Use default plan
      plan = this.creditPlanService.getDefaultPlan();
    }

    // Create payment record
    const payment = new this.paymentModel({
      organizationId: new Types.ObjectId(organizationId),
      instanceId: org.instanceId,
      userId: new Types.ObjectId(userId),
      amount: plan.priceUsd,
      currency: 'USD',
      status: 'pending',
      creditPlanId: data.planId
        ? new Types.ObjectId(data.planId)
        : undefined,
      creditType: plan.creditType || 'audit',
      auditCreditsGranted: plan.auditCredits || 0,
      tokenCreditsGranted: plan.tokenCredits || 0,
    });
    await payment.save();

    // If Dodo is not configured, return a mock URL for testing
    if (!this.dodoApiKey) {
      this.logger.warn(
        'DODO_API_KEY not configured — returning mock checkout URL',
      );
      return {
        checkoutUrl: `${data.returnUrl}?payment_id=${payment._id}&status=mock`,
        paymentId: payment._id.toString(),
      };
    }

    try {
      // Create Dodo Payments checkout session
      const dodoResponse = await fetch(`${this.dodoApiUrl}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.dodoApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billing: {
            city: 'N/A',
            country: 'IN',
            state: 'N/A',
            street: 'N/A',
            zipcode: '000000',
          },
          customer: {
            email: org.contactEmail,
            name: org.name,
          },
          payment_link: true,
          product_cart: plan.dodoProductId
            ? [
              {
                product_id: plan.dodoProductId,
                quantity: 1,
              },
            ]
            : undefined,
          return_url: data.returnUrl,
          metadata: {
            paymentId: payment._id.toString(),
            organizationId,
            userId,
            planId: data.planId || 'default',
          },
        }),
      });

      if (!dodoResponse.ok) {
        const errorBody = await dodoResponse.text();
        this.logger.error(`Dodo API error: ${dodoResponse.status} ${errorBody}`);
        throw new BadRequestException('Payment gateway error');
      }

      const dodoData = await dodoResponse.json();

      // Update payment with Dodo references
      payment.dodoPaymentId = dodoData.payment_id;
      payment.dodoCheckoutSessionId = dodoData.payment_id;
      await payment.save();

      return {
        checkoutUrl: dodoData.payment_link,
        paymentId: payment._id.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      payment.status = 'failed';
      payment.failureReason = error.message;
      await payment.save();
      throw new BadRequestException(
        'Failed to create payment session. Please try again.',
      );
    }
  }

  /**
   * Handle Dodo webhook event
   */
  async handleWebhook(event: any): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type || event.event_type}`);

    const eventType = event.type || event.event_type;
    const paymentData = event.data || event;

    switch (eventType) {
      case 'payment.succeeded':
      case 'payment.completed':
        await this.handlePaymentCompleted(paymentData);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(paymentData);
        break;
      case 'payment.refunded':
      case 'refund.succeeded':
        await this.handlePaymentRefunded(paymentData);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${eventType}`);
    }
  }

  private async handlePaymentCompleted(data: any): Promise<void> {
    const dodoPaymentId = data.payment_id || data.id;
    const metadata = data.metadata || {};

    // Find payment by Dodo payment ID or internal ID
    let payment = await this.paymentModel.findOne({
      $or: [
        { dodoPaymentId },
        { _id: metadata.paymentId ? new Types.ObjectId(metadata.paymentId) : undefined },
      ].filter(Boolean),
    });

    if (!payment) {
      this.logger.warn(`Payment not found for Dodo payment ${dodoPaymentId}`);
      return;
    }

    if (payment.status === 'completed') {
      this.logger.warn(`Payment ${payment._id} already completed — skipping`);
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.dodoPaymentId = dodoPaymentId;
    await payment.save();

    // Resolve instance ID — direct or via organization
    const instanceId =
      payment.instanceId?.toString() ||
      (await this.resolveInstanceFromOrg(payment.organizationId?.toString()));

    if (!instanceId) {
      this.logger.error(
        `Cannot grant credits — no instance found for payment ${payment._id}`,
      );
      return;
    }

    if (payment.auditCreditsGranted > 0) {
      await this.creditsService.addAuditCredits(
        instanceId,
        payment.auditCreditsGranted,
        `Credit purchase - Payment ${payment._id}`,
        payment.userId.toString(),
      );
    }

    if (payment.tokenCreditsGranted > 0) {
      await this.creditsService.addTokenCredits(
        instanceId,
        payment.tokenCreditsGranted,
        `Credit purchase - Payment ${payment._id}`,
        payment.userId.toString(),
      );
    }

    this.logger.log(
      `Credits added for payment ${payment._id}: ` +
      `${payment.auditCreditsGranted} audit, ${payment.tokenCreditsGranted} token`,
    );
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    const dodoPaymentId = data.payment_id || data.id;
    const payment = await this.paymentModel.findOne({ dodoPaymentId });

    if (payment && payment.status !== 'completed') {
      payment.status = 'failed';
      payment.failureReason = data.failure_reason || 'Payment failed';
      await payment.save();
      this.logger.warn(`Payment ${payment._id} marked as failed`);
    }
  }

  /**
   * Resolve an organization's linked instance ID (DRY helper)
   */
  private async resolveInstanceFromOrg(
    organizationId?: string,
  ): Promise<string | null> {
    if (!organizationId) return null;
    const org = await this.organizationModel
      .findById(organizationId)
      .select('instanceId')
      .lean()
      .exec();
    return org?.instanceId?.toString() || null;
  }

  private async handlePaymentRefunded(data: any): Promise<void> {
    const dodoPaymentId = data.payment_id || data.id;
    const payment = await this.paymentModel.findOne({ dodoPaymentId });

    if (payment) {
      payment.status = 'refunded';
      payment.refundReason = data.reason || 'Refund processed';
      await payment.save();
      this.logger.warn(`Payment ${payment._id} refunded`);
      // Note: Credit reversal could be handled here if needed
    }
  }

  /**
   * Verify Dodo webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.dodoWebhookSecret) {
      this.logger.warn('DODO_WEBHOOK_SECRET not set — skipping verification');
      return true; // Allow in dev
    }

    try {
      const crypto = require('crypto');
      const expectedSig = crypto
        .createHmac('sha256', this.dodoWebhookSecret)
        .update(payload)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig),
      );
    } catch {
      return false;
    }
  }

  /**
   * Get payment history for an organization
   */
  async getPaymentHistory(
    organizationId: string,
    options?: { limit?: number; skip?: number; status?: string },
  ): Promise<{ payments: Payment[]; total: number }> {
    const query: any = {
      organizationId: new Types.ObjectId(organizationId),
    };
    if (options?.status) query.status = options.status;

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 20)
        .skip(options?.skip || 0)
        .populate('creditPlanId', 'name creditType')
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return { payments, total };
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentModel
      .findById(id)
      .populate('creditPlanId', 'name creditType')
      .populate('organizationId', 'name slug')
      .exec();
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  /**
   * Get all payments (admin)
   */
  async getAllPayments(options?: {
    limit?: number;
    skip?: number;
    status?: string;
    organizationId?: string;
  }): Promise<{ payments: Payment[]; total: number }> {
    const query: any = {};
    if (options?.status) query.status = options.status;
    if (options?.organizationId) {
      query.organizationId = new Types.ObjectId(options.organizationId);
    }

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 20)
        .skip(options?.skip || 0)
        .populate('creditPlanId', 'name creditType')
        .populate('organizationId', 'name slug')
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return { payments, total };
  }

  /**
   * Manually mark a payment as completed (admin) — useful for testing
   */
  async manualComplete(paymentId: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    await this.handlePaymentCompleted({
      payment_id: payment.dodoPaymentId || paymentId,
      metadata: { paymentId },
    });

    return this.paymentModel.findById(paymentId).exec();
  }
}
