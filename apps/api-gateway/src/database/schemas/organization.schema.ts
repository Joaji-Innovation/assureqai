/**
 * Organization Schema - Multi-tenant support
 * Represents a customer organization linked to an Instance
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  companyName?: string;

  @Prop({ required: true, lowercase: true, trim: true })
  contactEmail: string;

  @Prop()
  phone?: string;

  @Prop({ type: Types.ObjectId, ref: 'Instance' })
  instanceId?: Types.ObjectId;

  // Branding
  @Prop()
  logo?: string; // URL to logo image

  @Prop()
  brandColor?: string; // Primary brand color hex

  // Billing
  @Prop({ enum: ['prepaid', 'postpaid'], default: 'prepaid' })
  billingType: 'prepaid' | 'postpaid';

  @Prop()
  dodoCustomerId?: string; // Dodo Payments customer ID

  // Plan
  @Prop({ enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' })
  plan: 'free' | 'starter' | 'pro' | 'enterprise';

  @Prop({
    enum: ['active', 'suspended', 'cancelled', 'trial'],
    default: 'active',
  })
  status: 'active' | 'suspended' | 'cancelled' | 'trial';

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  trialExpiresAt?: Date;

  // Limits
  @Prop({ type: Object })
  limits?: {
    maxUsers: number;
    maxProjects: number;
    maxStorage: string;
  };

  @Prop({ type: Object })
  settings?: Record<string, any>;

  @Prop()
  notes?: string; // Admin-only notes
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Indexes
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ instanceId: 1 });
OrganizationSchema.index({ status: 1 });
OrganizationSchema.index({ dodoCustomerId: 1 }, { sparse: true });
