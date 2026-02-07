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

    // Transform parameters to auditResults if parameters is provided (agent-ai format)
    // This matches the agent-ai API route transformation at lines 309-319
    let processedDto = { ...dto };
    if (dto.parameters && Array.isArray(dto.parameters) && dto.parameters.length > 0) {
      console.log('[AuditController] Transforming parameters to auditResults');
      processedDto.auditResults = dto.parameters.flatMap((param: any) =>
        (param.subParameters || []).map((subParam: any) => ({
          parameterId: subParam.id,
          parameterName: subParam.name,
          score: subParam.score || 0,
          maxScore: subParam.weight || 100,
          weight: subParam.weight || 100,
          type: subParam.type || 'Non-Fatal',
          comments: subParam.comments || '',
        }))
      );
      console.log('[AuditController] Transformed auditResults:', JSON.stringify(processedDto.auditResults?.[0]));
    }

    console.log('[AuditController] DTO received:', JSON.stringify({
      auditType: processedDto.auditType,
      agentName: processedDto.agentName,
      overallScore: processedDto.overallScore,
      campaignName: processedDto.campaignName,
      auditResultsType: Array.isArray(processedDto.auditResults) ? 'Array' : typeof processedDto.auditResults,
      auditResultsLength: processedDto.auditResults?.length,
      auditResultsSample: processedDto.auditResults?.[0] ? JSON.stringify(processedDto.auditResults[0]) : 'None'
    }));

    try {
      const result = await this.auditService.create({
        ...processedDto,
        projectId: processedDto.projectId || user.projectId,
      }, (user as any).instanceId);
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
    @Query('limit') limit: any = 10,
    @CurrentUser() user?: JwtPayload,
  ) {
    const numericLimit = Number(limit) || 10;
    console.log(`[AuditController] getLeaderboard called: limit=${numericLimit} (raw: ${limit}), projectId=${projectId}, role=${user?.role}`);

    // If client admin doesn't specify project, default to their own
    const scopedProjectId =
      (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.CLIENT_ADMIN) && projectId
        ? projectId
        : user?.projectId;

    console.log(`[AuditController] getLeaderboard scopedProjectId: ${scopedProjectId}`);

    return this.auditService.getLeaderboard(scopedProjectId, numericLimit);
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
