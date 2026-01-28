/**
 * Campaign Controller
 * RESTful API for bulk audit campaigns
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';
import { Roles, RequirePermissions, CurrentUser } from '@assureqai/auth';
import { ROLES, PERMISSIONS, JwtPayload, LIMITS } from '@assureqai/common';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  /**
   * Create a new bulk audit campaign
   */
  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Create a new bulk audit campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async create(@Body() dto: CreateCampaignDto, @CurrentUser() user: JwtPayload) {
    return this.campaignService.create(
      {
        ...dto,
        projectId: dto.projectId || user.projectId,
      },
      user.sub,
    );
  }

  /**
   * Get paginated list of campaigns
   */
  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_CAMPAIGNS)
  @ApiOperation({ summary: 'Get paginated list of campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = LIMITS.DEFAULT_PAGE_SIZE,
    @CurrentUser() user?: JwtPayload,
  ) {
    // Scope to user's project if not admin
    const scopedProjectId =
      user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.CLIENT_ADMIN
        ? projectId
        : user?.projectId;

    return this.campaignService.findAll(scopedProjectId, page, limit);
  }

  /**
   * Get campaign by ID
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_CAMPAIGNS)
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  /**
   * Cancel campaign
   */
  @Put(':id/cancel')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Cancel a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign cancelled' })
  async cancel(@Param('id') id: string) {
    return this.campaignService.cancel(id);
  }

  /**
   * Delete campaign
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  async delete(@Param('id') id: string) {
    await this.campaignService.delete(id);
    return { success: true, message: 'Campaign deleted' };
  }
}
