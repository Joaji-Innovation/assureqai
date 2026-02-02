/**
 * Audit Report Controller - Receives usage reports from isolated instances
 * Uses API Key authentication (not JWT)
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AuditReportService, CreateAuditReportDto } from './audit-report.service';
import { RequirePermissions } from '@assureqai/auth';
import { PERMISSIONS } from '@assureqai/common';

@ApiTags('Admin - Audit Reports')
@Controller('admin/audit-reports')
export class AuditReportController {
  constructor(private readonly auditReportService: AuditReportService) { }

  /**
   * Receive audit report from isolated instance
   * Authenticated via X-API-Key header
   */
  @Post()
  @ApiOperation({ summary: 'Submit audit report (from isolated instance)' })
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'Instance API key' })
  async create(
    @Headers('x-api-key') apiKey: string,
    @Body() dto: CreateAuditReportDto,
  ) {
    if (!apiKey) {
      throw new UnauthorizedException('X-API-Key header is required');
    }
    return this.auditReportService.create(apiKey, dto);
  }

  /**
   * Get all reports for an instance (admin view)
   */
  @Get('instance/:instanceId')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get audit reports for an instance' })
  async findByInstance(
    @Param('instanceId') instanceId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.auditReportService.findByInstance(instanceId, +page, +limit);
  }

  /**
   * Get statistics for an instance
   */
  @Get('instance/:instanceId/stats')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get audit statistics for an instance' })
  async getStats(
    @Param('instanceId') instanceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditReportService.getStats(
      instanceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get platform-wide statistics
   */
  @Get('stats')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get platform-wide audit report statistics' })
  async getPlatformStats() {
    return this.auditReportService.getPlatformStats();
  }
}
