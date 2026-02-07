/**
 * Instance Controller - For Admin Portal
 * API endpoints for managing client instances and domains
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstanceService } from './instance.service';
import { RequirePermissions } from '@assureqai/auth';
import { PERMISSIONS } from '@assureqai/common';

@ApiTags('Admin - Instances')
@ApiBearerAuth()
@Controller('admin/instances')
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) { }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Create new client instance' })
  async create(@Body() dto: any) {
    return this.instanceService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get all client instances' })
  async findAll() {
    return this.instanceService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get instance by ID' })
  async findOne(@Param('id') id: string) {
    return this.instanceService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update instance' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.instanceService.update(id, dto);
  }

  @Get(':id/logs')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get deployment logs' })
  async getLogs(@Param('id') id: string) {
    return this.instanceService.getLogs(id);
  }

  // ===== Domain Management =====

  @Get(':id/domains')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get domain configuration' })
  async getDomains(@Param('id') id: string) {
    return this.instanceService.getDomainConfig(id);
  }

  @Put(':id/domains/subdomain')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update subdomain' })
  async updateSubdomain(
    @Param('id') id: string,
    @Body() dto: { subdomain: string },
  ) {
    return this.instanceService.updateSubdomain(id, dto.subdomain);
  }

  @Post(':id/domains/custom')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Add custom domain' })
  async addCustomDomain(
    @Param('id') id: string,
    @Body() dto: { domain: string },
  ) {
    return this.instanceService.addCustomDomain(id, dto.domain);
  }

  @Post(':id/domains/verify')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Verify custom domain DNS' })
  async verifyDomain(@Param('id') id: string) {
    return this.instanceService.verifyCustomDomain(id);
  }

  @Delete(':id/domains/custom')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Remove custom domain' })
  async removeCustomDomain(@Param('id') id: string) {
    return this.instanceService.removeCustomDomain(id);
  }

  // ===== API Key Management =====

  @Post(':id/regenerate-api-key')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Regenerate API key for instance' })
  async regenerateApiKey(@Param('id') id: string) {
    return this.instanceService.regenerateApiKey(id);
  }

  // ===== Billing Management =====

  @Put(':id/billing-type')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update billing type (prepaid/postpaid)' })
  async updateBillingType(
    @Param('id') id: string,
    @Body() dto: { billingType: 'prepaid' | 'postpaid' },
  ) {
    return this.instanceService.updateBillingType(id, dto.billingType);
  }

  // ===== Limits & Credits Management =====

  @Put(':id/limits')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update instance limits (maxUsers, maxStorage)' })
  async updateLimits(
    @Param('id') id: string,
    @Body() dto: { maxUsers?: number; maxStorage?: string },
  ) {
    return this.instanceService.updateLimits(id, dto);
  }

  @Put(':id/credits')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update instance credits (totalAudits, totalTokens)' })
  async updateCredits(
    @Param('id') id: string,
    @Body() dto: { totalAudits?: number; totalTokens?: number; usedAudits?: number; usedTokens?: number },
  ) {
    return this.instanceService.updateCredits(id, dto);
  }

  // ===== Instance Actions (Start/Stop/Restart) =====

  @Post(':id/start')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Start instance containers' })
  async startInstance(@Param('id') id: string) {
    return this.instanceService.startInstance(id);
  }

  @Post(':id/stop')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Stop instance containers' })
  async stopInstance(@Param('id') id: string) {
    return this.instanceService.stopInstance(id);
  }

  @Post(':id/restart')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Restart instance containers' })
  async restartInstance(@Param('id') id: string) {
    return this.instanceService.restartInstance(id);
  }
}
