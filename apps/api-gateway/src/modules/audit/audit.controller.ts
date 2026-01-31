/**
 * Audit Controller
 * RESTful API for audit operations
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditDto, UpdateAuditDto, AuditFiltersDto } from './dto';
import { Roles, RequirePermissions, CurrentUser } from '@assureqai/auth';
import { ROLES, PERMISSIONS, JwtPayload, LIMITS } from '@assureqai/common';

@ApiTags('Audits')
@ApiBearerAuth()
@Controller('audits')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  /**
   * Create a new audit
   */
  @Post()
  @RequirePermissions(PERMISSIONS.PERFORM_AUDIT)
  @ApiOperation({ summary: 'Create a new audit' })
  @ApiResponse({ status: 201, description: 'Audit created successfully' })
  async create(@Body() dto: CreateAuditDto, @CurrentUser() user: JwtPayload) {
    console.log('[AuditController] POST /audits called by user:', user?.username, 'role:', user?.role);
    console.log('[AuditController] DTO received:', JSON.stringify({
      auditType: dto.auditType,
      agentName: dto.agentName,
      overallScore: dto.overallScore,
      campaignName: dto.campaignName
    }));

    try {
      const result = await this.auditService.create({
        ...dto,
        projectId: dto.projectId || user.projectId,
      });
      console.log('[AuditController] Audit created successfully, id:', (result as any)._id);
      return result;
    } catch (error) {
      console.error('[AuditController] Error creating audit:', error);
      throw error;
    }
  }

  /**
   * Get paginated list of audits
   */
  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_ALL_AUDITS)
  @ApiOperation({ summary: 'Get paginated list of audits' })
  @ApiResponse({ status: 200, description: 'Audits retrieved successfully' })
  async findAll(
    @Query() filters: AuditFiltersDto,
    @Query('page') page = 1,
    @Query('limit') limit = LIMITS.DEFAULT_PAGE_SIZE,
    @CurrentUser() user: JwtPayload,
  ) {
    // Scope to user's project if not admin
    if (user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.CLIENT_ADMIN) {
      filters.projectId = user.projectId;
    }
    return this.auditService.findWithFilters(filters, page, limit);
  }

  /**
   * Get audit statistics (cached for 30 seconds)
   */
  @Get('stats')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000) // 30 seconds cache
  @RequirePermissions(PERMISSIONS.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get comprehensive audit statistics with caching' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getStats(
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('auditType') auditType?: 'ai' | 'manual',
    @Query('campaignName') campaignName?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    // Scope to user's project if not admin
    const scopedProjectId =
      user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.CLIENT_ADMIN
        ? projectId
        : user?.projectId;

    return this.auditService.getStats(scopedProjectId, dateRange, { auditType, campaignName });
  }

  /**
   * Get leaderboard (cached for 60 seconds)
   */
  @Get('leaderboard')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000) // 60 seconds cache
  @ApiOperation({ summary: 'Get agent leaderboard with caching' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved' })
  async getLeaderboard(
    @Query('projectId') projectId?: string,
    @Query('limit') limit = 10,
    @CurrentUser() user?: JwtPayload,
  ) {
    const scopedProjectId =
      user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.CLIENT_ADMIN
        ? projectId
        : user?.projectId;

    return this.auditService.getLeaderboard(scopedProjectId, limit);
  }

  /**
   * Get single audit by ID
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_ALL_AUDITS)
  @ApiOperation({ summary: 'Get audit by ID' })
  @ApiResponse({ status: 200, description: 'Audit retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit not found' })
  async findOne(@Param('id') id: string) {
    return this.auditService.findById(id);
  }

  /**
   * Update audit
   */
  @Put(':id')
  @RequirePermissions(PERMISSIONS.PERFORM_AUDIT)
  @ApiOperation({ summary: 'Update audit' })
  @ApiResponse({ status: 200, description: 'Audit updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateAuditDto) {
    return this.auditService.update(id, dto);
  }

  /**
   * Delete audit
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.DELETE_AUDITS)
  @ApiOperation({ summary: 'Delete audit' })
  @ApiResponse({ status: 200, description: 'Audit deleted successfully' })
  async delete(@Param('id') id: string) {
    await this.auditService.delete(id);
    return { success: true, message: 'Audit deleted' };
  }
}
