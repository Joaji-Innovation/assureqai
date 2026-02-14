/**
 * Credit Plan Service - Admin-managed credit packages
 */
import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreditPlan,
  CreditPlanDocument,
} from '../../database/schemas/credit-plan.schema';

// Default plan when no plans are configured
const DEFAULT_PLAN: Partial<CreditPlan> = {
  name: 'Standard Credit Pack',
  description: 'Get 100 audit credits to power your QA operations.',
  creditType: 'audit',
  auditCredits: 100,
  tokenCredits: 0,
  priceUsd: 2900, // $29.00 in cents
  priceInr: 240000, // ₹2,400 in paise
  sortOrder: 0,
  isFeatured: true,
  isPopular: true,
  isActive: true,
  features: [
    '100 AI Audit Credits',
    'Real-time Scoring',
    'Advanced Dashboard',
    'Priority Support',
  ],
};

@Injectable()
export class CreditPlanService {
  private readonly logger = new Logger(CreditPlanService.name);

  constructor(
    @InjectModel(CreditPlan.name)
    private creditPlanModel: Model<CreditPlanDocument>,
  ) { }

  // Create a new credit plan
  async create(data: Partial<CreditPlan>): Promise<CreditPlan> {
    const plan = new this.creditPlanModel(data);
    const saved = await plan.save();
    this.logger.log(`Created credit plan: ${saved.name}`);
    return saved;
  }

  // Get all active plans (for customers)
  async getActivePlans(): Promise<CreditPlan[]> {
    const plans = await this.creditPlanModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, priceUsd: 1 })
      .exec();

    // If no plans exist, return the default plan
    if (plans.length === 0) {
      return [DEFAULT_PLAN as any];
    }

    return plans;
  }

  // Get all plans (for admin, including inactive)
  async findAll(): Promise<CreditPlan[]> {
    return this.creditPlanModel
      .find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();
  }

  // Find by ID
  async findById(id: string): Promise<CreditPlan> {
    const plan = await this.creditPlanModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException(`Credit plan ${id} not found`);
    }
    return plan;
  }

  // Update plan
  async update(id: string, data: Partial<CreditPlan>): Promise<CreditPlan> {
    const plan = await this.creditPlanModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    if (!plan) {
      throw new NotFoundException(`Credit plan ${id} not found`);
    }
    return plan;
  }

  // Delete plan
  async delete(id: string): Promise<{ success: boolean }> {
    const result = await this.creditPlanModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Credit plan ${id} not found`);
    }
    return { success: true };
  }

  // Toggle plan active status
  async toggleActive(id: string): Promise<CreditPlan> {
    const plan = await this.findById(id);
    return this.update(id, { isActive: !plan.isActive });
  }

  // Find by Dodo product ID
  async findByDodoProductId(productId: string): Promise<CreditPlan | null> {
    return this.creditPlanModel.findOne({ dodoProductId: productId }).exec();
  }

  // Get default plan
  getDefaultPlan(): Partial<CreditPlan> {
    return { ...DEFAULT_PLAN };
  }
}
