/**
 * Provisioning Controller - Deploy and manage client instances
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvisioningService, DeployConfig } from './provisioning.service';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';
import { InstanceService } from '../instance/instance.service';

@ApiTags('Admin - Provisioning')
@ApiBearerAuth()
@Controller('admin/provisioning')
export class ProvisioningController {
  constructor(
    private readonly provisioningService: ProvisioningService,
    private readonly instanceService: InstanceService,
  ) {}

  @Post(':instanceId/deploy')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Deploy instance to VPS' })
  async deploy(
    @Param('instanceId') instanceId: string,
    @Body() dto: {
      version?: string;
    },
  ) {
    const instance = await this.instanceService.findById(instanceId);
    
    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found for instance' };
    }

    const config: DeployConfig = {
      host: instance.vps.host,
      port: instance.vps.sshPort || 22,
      username: instance.vps.sshUser,
      // privateKey would be retrieved from secure vault
    };

    const result = await this.provisioningService.deploy(config, {
      version: dto.version || 'latest',
      instanceId: instance.clientId,
      mongoUri: `mongodb://localhost:27017/${instance.clientId}`,
      apiKey: instance.apiKey || '',
      domain: `${instance.domain.subdomain}.assureqai.com`,
    });

    // Update instance status based on result
    if (result.success) {
      await this.instanceService.update(instanceId, {
        status: 'active',
        deployedVersion: dto.version || 'latest',
        lastHealthCheck: new Date(),
      } as any);
    }

    return result;
  }

  @Post(':instanceId/update')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Update instance to new version' })
  async update(
    @Param('instanceId') instanceId: string,
    @Body() dto: { version: string },
  ) {
    const instance = await this.instanceService.findById(instanceId);
    
    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    const config: DeployConfig = {
      host: instance.vps.host,
      port: instance.vps.sshPort || 22,
      username: instance.vps.sshUser,
    };

    const result = await this.provisioningService.update(config, dto.version);

    if (result.success) {
      await this.instanceService.update(instanceId, {
        deployedVersion: dto.version,
      } as any);
    }

    return result;
  }

  @Post(':instanceId/restart')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Restart instance containers' })
  async restart(@Param('instanceId') instanceId: string) {
    const instance = await this.instanceService.findById(instanceId);
    
    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    const config: DeployConfig = {
      host: instance.vps.host,
      port: instance.vps.sshPort || 22,
      username: instance.vps.sshUser,
    };

    return this.provisioningService.restart(config);
  }

  @Post(':instanceId/stop')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Stop instance containers' })
  async stop(@Param('instanceId') instanceId: string) {
    const instance = await this.instanceService.findById(instanceId);
    
    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    const config: DeployConfig = {
      host: instance.vps.host,
      port: instance.vps.sshPort || 22,
      username: instance.vps.sshUser,
    };

    const result = await this.provisioningService.stop(config);

    if (result.success) {
      await this.instanceService.update(instanceId, {
        status: 'suspended',
      } as any);
    }

    return result;
  }

  @Get(':instanceId/logs')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Get instance logs' })
  async getLogs(
    @Param('instanceId') instanceId: string,
    @Query('lines') lines?: number,
  ) {
    const instance = await this.instanceService.findById(instanceId);
    
    if (!instance.vps?.host) {
      return { logs: '', error: 'No VPS configuration found' };
    }

    const config: DeployConfig = {
      host: instance.vps.host,
      port: instance.vps.sshPort || 22,
      username: instance.vps.sshUser,
    };

    return this.provisioningService.getLogs(config, lines || 100);
  }

  @Get(':instanceId/health')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Check instance health' })
  async checkHealth(@Param('instanceId') instanceId: string) {
    const instance = await this.instanceService.findById(instanceId);
    
    if (!instance.vps?.host) {
      return { healthy: false, status: 'no_vps_config' };
    }

    const config: DeployConfig = {
      host: instance.vps.host,
      port: instance.vps.sshPort || 22,
      username: instance.vps.sshUser,
    };

    const health = await this.provisioningService.checkHealth(config);

    // Update last health check
    await this.instanceService.update(instanceId, {
      lastHealthCheck: new Date(),
      status: health.healthy ? 'active' : 'provisioning',
    } as any);

    return health;
  }
}
