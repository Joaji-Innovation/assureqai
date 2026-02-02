/**
 * Instance Schema - For Admin Portal
 * Represents a client instance with domain configuration
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InstanceDocument = HydratedDocument<Instance>;

// Domain configuration sub-schema
export class InstanceDomain {
  @Prop({ required: true, unique: true })
  subdomain: string; // e.g., "acme" → acme.assureqai.com

  @Prop()
  customDomain?: string; // e.g., "qa.acme.com"

  @Prop({ default: false })
  customDomainVerified: boolean;

  @Prop()
  dnsVerificationToken?: string;

  @Prop({ enum: ['pending', 'active', 'expired', 'error'], default: 'pending' })
  sslStatus: 'pending' | 'active' | 'expired' | 'error';

  @Prop()
  lastVerifiedAt?: Date;
}

// VPS configuration sub-schema
export class VpsConfig {
  @Prop()
  host: string;

  @Prop()
  sshUser: string;

  @Prop()
  sshPort: number;

  @Prop()
  lastDeployment?: Date;

  // SSH key stored encrypted separately
}

// Credit limits sub-schema
export class CreditLimits {
  @Prop({ enum: ['prepaid', 'postpaid'], default: 'prepaid' })
  billingType: 'prepaid' | 'postpaid';

  @Prop({ default: 0 })
  totalAudits: number;

  @Prop({ default: 0 })
  usedAudits: number;

  @Prop({ default: 0 })
  totalTokens: number;

  @Prop({ default: 0 })
  usedTokens: number;

  @Prop({ default: 0 })
  totalApiCalls: number; // Total API calls made

  @Prop()
  lastResetAt?: Date; // For monthly reset cycles
}

// Database configuration sub-schema
export class DatabaseConfig {
  @Prop({ enum: ['shared', 'isolated_db', 'isolated_server'], default: 'shared' })
  type: 'shared' | 'isolated_db' | 'isolated_server';
  // shared = Same MongoDB, scoped by projectId
  // isolated_db = Same MongoDB server, separate database per instance
  // isolated_server = Different MongoDB server entirely

  @Prop()
  mongoUri?: string; // Only for isolated_server

  @Prop()
  dbName?: string; // Only for isolated_db

  @Prop({ default: false })
  isConfigured: boolean;
}

@Schema({ timestamps: true })
export class Instance {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  clientId: string;

  @Prop()
  companyName?: string;

  @Prop()
  contactEmail?: string;

  @Prop({ type: InstanceDomain })
  domain: InstanceDomain;

  @Prop({ enum: ['trial', 'standard', 'enterprise'], default: 'trial' })
  plan: 'trial' | 'standard' | 'enterprise';

  @Prop({ enum: ['provisioning', 'active', 'suspended', 'terminated'], default: 'provisioning' })
  status: 'provisioning' | 'active' | 'suspended' | 'terminated';

  @Prop({ type: VpsConfig })
  vps?: VpsConfig;

  @Prop({ type: CreditLimits })
  credits: CreditLimits;

  @Prop({ type: DatabaseConfig })
  database?: DatabaseConfig;

  @Prop()
  trialExpiresAt?: Date;

  @Prop()
  apiKey?: string; // Instance API key for cross-service auth

  @Prop({ type: Object })
  limits?: {
    maxUsers: number;
    maxStorage: string;
  };

  @Prop({ type: Object })
  settings?: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastHealthCheck?: Date;

  @Prop()
  deployedVersion?: string;
}

export const InstanceSchema = SchemaFactory.createForClass(Instance);

// Indexes (avoid duplicating @Prop indexes)
InstanceSchema.index({ 'domain.subdomain': 1 }, { unique: true });
InstanceSchema.index({ 'domain.customDomain': 1 }, { sparse: true });
InstanceSchema.index({ status: 1 });
