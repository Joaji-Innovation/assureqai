/**
 * Instance Service - For Admin Portal
 * Manages client instances and domain configuration
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Instance,
  InstanceDocument,
} from '../../database/schemas/instance.schema';
import {
  Project,
  ProjectDocument,
} from '../../database/schemas/project.schema';
import { randomBytes } from 'crypto';
import * as dns from 'dns';
import { promisify } from 'util';
import { ProvisioningService } from '../provisioning/provisioning.service';

const resolveTxt = promisify(dns.resolveTxt);

@Injectable()
export class InstanceService {
  private readonly logger = new Logger(InstanceService.name);

  constructor(
    @InjectModel(Instance.name) private instanceModel: Model<InstanceDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @Inject(forwardRef(() => ProvisioningService))
    private provisioningService: ProvisioningService,
  ) {}

  // Create new instance
  async create(data: Partial<Instance> & { vps?: any }): Promise<Instance> {
    // Generate subdomain from company name if not provided
    if (!data.domain?.subdomain) {
      data.domain = {
        ...data.domain,
        subdomain: this.generateSubdomain(
          data.companyName || data.name || 'client',
        ),
        sslStatus: 'pending',
        customDomainVerified: false,
      };
    }

    // Check if subdomain already exists
    const existing = await this.instanceModel.findOne({
      'domain.subdomain': data.domain.subdomain,
    });
    if (existing) {
      throw new ConflictException(
        `Subdomain ${data.domain.subdomain} already exists`,
      );
    }

    // Generate API key
    if (!data.apiKey) data.apiKey = this.generateApiKey();
    if (!data.clientId)
      data.clientId = `client_${randomBytes(8).toString('hex')}`;

    // Set initial status based on deployment type
    if (data.vps) {
      data.status = 'provisioning';
    } else {
      // Cloud instances might default to active if purely virtual/mock,
      // or provisioning if there's a cloud provisioner (which is missing/implicit).
      // For now, assuming standard creation is 'active' or 'provisioning'.
      data.status = 'active';
    }

    const instance = new this.instanceModel(data);
    const savedInstance = await instance.save();

    // For shared-database instances, auto-create a Project linked to this Instance
    if (!data.database?.type || data.database.type === 'shared') {
      const project = await this.projectModel.create({
        name: data.companyName || data.name || 'Client Project',
        description: `Default project for instance ${savedInstance.name}`,
        isActive: true,
        instanceId: savedInstance._id,
        settings: { language: 'en', timezone: 'UTC' },
      });
      this.logger.log(
        `Auto-created project ${project._id} linked to instance ${savedInstance._id}`,
      );
    }

    // Trigger On-Premise / VPS Deployment
    if (data.vps) {
      // Extract password transiently (not stored in DB for security)
      const sshPassword = data.vps?.password;
      this.triggerDeployment(savedInstance, sshPassword).catch((err) =>
        this.logger.error('Background deployment failed', err),
      );
    }

    return savedInstance;
  }

  private async triggerDeployment(
    instance: InstanceDocument,
    sshPassword?: string,
  ) {
    if (!instance.vps) return;

    try {
      // Determine MongoDB URI for this instance
      let mongoUri = 'mongodb://mongo:27017/assureqai'; // Default for shared/container
      if (
        instance.database?.type === 'isolated_server' &&
        instance.database.mongoUri
      ) {
        mongoUri = instance.database.mongoUri;
      } else if (
        instance.database?.type === 'isolated_db' &&
        instance.database.dbName
      ) {
        mongoUri = `mongodb://mongo:27017/${instance.database.dbName}`;
      }

      const result = await this.provisioningService.deploy(
        {
          host: instance.vps.host,
          username: instance.vps.sshUser,
          port: instance.vps.sshPort,
          password: sshPassword,
        },
        {
          version: 'latest',
          instanceId: instance.clientId,
          mongoUri,
          apiKey: instance.apiKey,
          domain:
            instance.domain.customDomain ||
            `${instance.domain.subdomain}.assureqai.com`,
        },
      );

      // Store real deployment logs
      const logEntry = {
        action: 'deploy',
        status: result.success ? 'success' : 'failed',
        logs: result.logs,
        duration: result.duration,
        error: result.error,
        createdAt: new Date(),
      };

      if (result.success) {
        await this.instanceModel.findByIdAndUpdate(instance._id, {
          status: 'running',
          'vps.lastDeployment': new Date(),
          $push: { deploymentLogs: { $each: [logEntry], $slice: -50 } }, // Keep last 50 logs
        });
      } else {
        await this.instanceModel.findByIdAndUpdate(instance._id, {
          status: 'error',
          $push: { deploymentLogs: { $each: [logEntry], $slice: -50 } },
        });
      }
    } catch (error) {
      this.logger.error('Deployment error', error);
      await this.instanceModel.findByIdAndUpdate(instance._id, {
        status: 'error',
      });
    }
  }

  // Find all instances
  async findAll(): Promise<Instance[]> {
    return this.instanceModel.find().sort({ createdAt: -1 }).exec();
  }

  // Find by ID
  async findById(id: string): Promise<Instance> {
    const instance = await this.instanceModel.findById(id).exec();
    if (!instance) {
      throw new NotFoundException(`Instance ${id} not found`);
    }
    return instance;
  }

  // Find by client ID
  async findByClientId(clientId: string): Promise<Instance> {
    const instance = await this.instanceModel.findOne({ clientId }).exec();
    if (!instance) {
      throw new NotFoundException(
        `Instance with clientId ${clientId} not found`,
      );
    }
    return instance;
  }

  // Update instance
  async update(id: string, data: Partial<Instance>): Promise<Instance> {
    const instance = await this.instanceModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!instance) {
      throw new NotFoundException(`Instance ${id} not found`);
    }
    return instance;
  }

  // ===== Domain Management =====

  // Update subdomain
  async updateSubdomain(id: string, subdomain: string): Promise<Instance> {
    // Validate subdomain format
    if (
      !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) ||
      subdomain.length < 3
    ) {
      throw new ConflictException(
        'Subdomain must be lowercase alphanumeric with hyphens, min 3 chars',
      );
    }

    // Check if subdomain already exists
    const existing = await this.instanceModel.findOne({
      'domain.subdomain': subdomain,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictException(`Subdomain ${subdomain} already exists`);
    }

    return this.update(id, {
      'domain.subdomain': subdomain,
      'domain.sslStatus': 'pending',
    } as any);
  }

  // Add custom domain
  async addCustomDomain(id: string, customDomain: string): Promise<Instance> {
    // Validate domain format
    if (
      !/^[a-z0-9][a-z0-9.-]*[a-z0-9]\.[a-z]{2,}$/.test(
        customDomain.toLowerCase(),
      )
    ) {
      throw new ConflictException('Invalid domain format');
    }

    // Check if domain already exists
    const existing = await this.instanceModel.findOne({
      'domain.customDomain': customDomain.toLowerCase(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictException(`Domain ${customDomain} is already in use`);
    }

    // Generate DNS verification token
    const verificationToken = `assureqai-verify=${randomBytes(16).toString('hex')}`;

    return this.update(id, {
      'domain.customDomain': customDomain.toLowerCase(),
      'domain.customDomainVerified': false,
      'domain.dnsVerificationToken': verificationToken,
    } as any);
  }

  // Verify custom domain DNS
  async verifyCustomDomain(
    id: string,
  ): Promise<{ verified: boolean; message: string }> {
    const instance = await this.findById(id);

    if (!instance.domain?.customDomain) {
      throw new NotFoundException('No custom domain configured');
    }

    if (!instance.domain.dnsVerificationToken) {
      throw new ConflictException('No verification token found');
    }

    try {
      // Lookup TXT records for the domain
      const records = await resolveTxt(
        `_assureqai.${instance.domain.customDomain}`,
      );
      const flatRecords = records.flat();

      // Check if verification token exists
      const verified = flatRecords.includes(
        instance.domain.dnsVerificationToken,
      );

      if (verified) {
        await this.update(id, {
          'domain.customDomainVerified': true,
          'domain.sslStatus': 'pending', // Will be updated by Caddy
          'domain.lastVerifiedAt': new Date(),
        } as any);

        return { verified: true, message: 'Domain verified successfully' };
      }

      return {
        verified: false,
        message: `TXT record not found. Add: _assureqai.${instance.domain.customDomain} TXT "${instance.domain.dnsVerificationToken}"`,
      };
    } catch (error) {
      return {
        verified: false,
        message: `DNS lookup failed. Add TXT record: _assureqai.${instance.domain.customDomain} with value "${instance.domain.dnsVerificationToken}"`,
      };
    }
  }

  // Remove custom domain
  async removeCustomDomain(id: string): Promise<Instance> {
    return this.update(id, {
      'domain.customDomain': null,
      'domain.customDomainVerified': false,
      'domain.dnsVerificationToken': null,
    } as any);
  }

  // Get domain configuration
  async getDomainConfig(id: string): Promise<{
    subdomain: string;
    subdomainUrl: string;
    customDomain?: string;
    customDomainVerified: boolean;
    dnsVerificationToken?: string;
    sslStatus: string;
  }> {
    const instance = await this.findById(id);
    const domain = instance.domain;

    return {
      subdomain: domain.subdomain,
      subdomainUrl: `https://${domain.subdomain}.assureqai.com`,
      customDomain: domain.customDomain,
      customDomainVerified: domain.customDomainVerified,
      dnsVerificationToken: domain.dnsVerificationToken,
      sslStatus: domain.sslStatus,
    };
  }

  // ===== Helpers =====

  private generateSubdomain(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
  }

  // Get deployment logs (from stored real deployment results)
  async getLogs(id: string): Promise<any[]> {
    const instance = await this.findById(id);
    const logs = (instance as any).deploymentLogs || [];

    // Return stored logs, mapped to expected format
    return logs
      .map((log: any, index: number) => ({
        id: `log_${(instance as any)._id}_${index}`,
        instanceId: instance.clientId,
        instanceName: instance.name,
        action: log.action || 'deploy',
        status: log.status || 'success',
        logs: log.logs || [],
        duration: log.duration,
        error: log.error,
        createdAt: log.createdAt
          ? new Date(log.createdAt).toISOString()
          : new Date().toISOString(),
      }))
      .reverse(); // Most recent first
  }

  private generateApiKey(): string {
    return `aq_${randomBytes(24).toString('hex')}`;
  }

  // Regenerate API key for an instance
  async regenerateApiKey(id: string): Promise<{ apiKey: string }> {
    const newApiKey = this.generateApiKey();
    await this.instanceModel.findByIdAndUpdate(id, { apiKey: newApiKey });
    return { apiKey: newApiKey };
  }

  // Update billing type
  async updateBillingType(
    id: string,
    billingType: 'prepaid' | 'postpaid',
  ): Promise<Instance> {
    return this.update(id, {
      'credits.billingType': billingType,
    } as any);
  }

  // Increment API call counter (called by ApiKeyGuard or middleware)
  async incrementApiCalls(id: string): Promise<void> {
    await this.instanceModel.findByIdAndUpdate(id, {
      $inc: { 'credits.totalApiCalls': 1 },
    });
  }

  // Update instance limits (maxUsers, maxStorage)
  async updateLimits(
    id: string,
    limits: { maxUsers?: number; maxStorage?: string },
  ): Promise<Instance> {
    const updateData: any = {};
    if (limits.maxUsers !== undefined)
      updateData['limits.maxUsers'] = limits.maxUsers;
    if (limits.maxStorage !== undefined)
      updateData['limits.maxStorage'] = limits.maxStorage;
    return this.update(id, updateData);
  }

  // Update instance credits (totalAudits, totalTokens)
  async updateCredits(
    id: string,
    credits: {
      totalAudits?: number;
      totalTokens?: number;
      usedAudits?: number;
      usedTokens?: number;
    },
  ): Promise<Instance> {
    const updateData: any = {};
    if (credits.totalAudits !== undefined)
      updateData['credits.totalAudits'] = credits.totalAudits;
    if (credits.totalTokens !== undefined)
      updateData['credits.totalTokens'] = credits.totalTokens;
    if (credits.usedAudits !== undefined)
      updateData['credits.usedAudits'] = credits.usedAudits;
    if (credits.usedTokens !== undefined)
      updateData['credits.usedTokens'] = credits.usedTokens;
    return this.update(id, updateData);
  }

  // Update instance usage metrics (called by agent)
  async updateUsage(
    id: string,
    usage: {
      cpu: number;
      memory: number;
      storage: string;
      activeUsers: number;
    },
  ): Promise<Instance> {
    return this.update(id, {
      usage: {
        ...usage,
        lastReportedAt: new Date(),
      },
    } as any);
  }

  // ===== Instance Lifecycle Actions =====

  // Start instance containers
  async startInstance(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    const instance = await this.findById(id);

    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    try {
      const result = await this.provisioningService.start({
        host: instance.vps.host,
        username: instance.vps.sshUser,
        port: instance.vps.sshPort || 22,
      });

      if (result.success) {
        await this.update(id, { status: 'running' } as any);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to start containers',
        };
      }
    } catch (error) {
      this.logger.error('Start instance error:', error);
      return { success: false, error: 'Failed to connect to instance' };
    }
  }

  // Stop instance containers
  async stopInstance(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    const instance = await this.findById(id);

    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    try {
      const result = await this.provisioningService.stop({
        host: instance.vps.host,
        username: instance.vps.sshUser,
        port: instance.vps.sshPort || 22,
      });

      if (result.success) {
        await this.update(id, { status: 'stopped' } as any);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to stop containers',
        };
      }
    } catch (error) {
      this.logger.error('Stop instance error:', error);
      return { success: false, error: 'Failed to connect to instance' };
    }
  }

  // Restart instance containers
  async restartInstance(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    const instance = await this.findById(id);

    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    try {
      const result = await this.provisioningService.restart({
        host: instance.vps.host,
        username: instance.vps.sshUser,
        port: instance.vps.sshPort || 22,
      });

      if (result.success) {
        await this.update(id, { status: 'running' } as any);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to restart containers',
        };
      }
    } catch (error) {
      this.logger.error('Restart instance error:', error);
      return { success: false, error: 'Failed to connect to instance' };
    }
  }
}
