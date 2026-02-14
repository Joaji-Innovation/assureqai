/**
 * Credit Plan Schema - Admin-managed credit packages
 * These are the purchasable credit packs shown to customers
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CreditPlanDocument = HydratedDocument<CreditPlan>;

@Schema({ timestamps: true })
export class CreditPlan {
  @Prop({ required: true, trim: true })
  name: string; // e.g., "Starter Pack"

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: ['audit', 'token', 'combo'], required: true })
  creditType: 'audit' | 'token' | 'combo';

  // Credit amounts
  @Prop({ default: 0 })
  auditCredits: number;

  @Prop({ default: 0 })
  tokenCredits: number;

  // Pricing (support multiple currencies)
  @Prop({ required: true })
  priceUsd: number; // Price in USD (cents)

  @Prop()
  priceInr?: number; // Price in INR (paise)

  // Dodo Payments product ID (set after creating product in Dodo dashboard)
  @Prop()
  dodoProductId?: string;

  // Display
  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: false })
  isFeatured: boolean; // Highlight this plan

  @Prop({ default: false })
  isPopular: boolean; // Show "Popular" badge

  @Prop({ type: [String], default: [] })
  features: string[]; // Feature bullet points

  @Prop({ default: true })
  isActive: boolean;

  // Validity
  @Prop()
  validityDays?: number; // Credits expire after N days (null = never)

  // Usage limits
  @Prop()
  maxPurchasePerMonth?: number; // Max times a customer can buy this per month
}

export const CreditPlanSchema = SchemaFactory.createForClass(CreditPlan);

// Indexes
CreditPlanSchema.index({ isActive: 1, sortOrder: 1 });
CreditPlanSchema.index({ creditType: 1 });
CreditPlanSchema.index({ dodoProductId: 1 }, { sparse: true });
