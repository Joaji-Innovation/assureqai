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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';
import { Roles, RequirePermissions, CurrentUser } from '@assureqai/auth';
import { ROLES, PERMISSIONS, JwtPayload, LIMITS } from '@assureqai/common';
import { join } from 'path';
import * as fs from 'fs';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignController {
  private readonly logger = new Logger(CampaignController.name);

  constructor(private readonly campaignService: CampaignService) {}

  /**
   * Bulk upload audio files for campaign
   */
  @Post('bulk-upload')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Bulk upload audio files for campaign' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        campaignName: { type: 'string' },
        qaParameterSetId: { type: 'string' },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async bulkUpload(
    @UploadedFiles() files: Array<any>,
    @Body() body: { campaignName: string; qaParameterSetId: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const jobs = [];
    const uploadDir = join(process.cwd(), 'uploads');

    // Ensure upload dir exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of files) {
      // sanitize filename
      const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${originalName}`;
      const filepath = join(uploadDir, filename);

      fs.writeFileSync(filepath, file.buffer);

      const audioUrl = process.env.NEXT_PUBLIC_API_URL
        ? new URL(`/api/uploads/${filename}`, process.env.NEXT_PUBLIC_API_URL).toString()
        : `/api/uploads/${filename}`;

      jobs.push({
        audioUrl,
        agentName: 'Unknown Agent',
        callId: originalName,
      });
    }

    return this.campaignService.create(
      {
        name: body.campaignName,
        qaParameterSetId: body.qaParameterSetId,
        projectId: user.projectId,
        jobs,
      },
      user.sub,
    );
  }

  /**
   * Upload single audio file and add to campaign
   */
  @Post(':id/upload')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Upload single audio file and add to campaign' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('file', 1))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFiles() files: Array<any>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file uploaded');
    }
    const file = files[0];

    try {
      // Save file
      const uploadDir = join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Sanitize
      const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${originalName}`;
      const filepath = join(uploadDir, filename);

      fs.writeFileSync(filepath, file.buffer);

      const audioUrl = process.env.NEXT_PUBLIC_API_URL
        ? new URL(`/api/uploads/${filename}`, process.env.NEXT_PUBLIC_API_URL).toString()
        : `/api/uploads/${filename}`;

      // Add job
      return await this.campaignService.addJob(id, {
        audioUrl,
        agentName: 'Unknown',
        callId: originalName,
      });
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Create a new bulk audit campaign
   */
  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Create a new bulk audit campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async create(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: JwtPayload,
  ) {
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
   * Pause campaign
   */
  @Put(':id/pause')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Pause a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign paused' })
  async pause(@Param('id') id: string) {
    return this.campaignService.pause(id);
  }

  /**
   * Resume campaign
   */
  @Put(':id/resume')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Resume a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign resumed' })
  async resume(@Param('id') id: string) {
    return this.campaignService.resume(id);
  }

  /**
   * Retry failed jobs
   */
  @Post(':id/retry')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Retry failed jobs in a campaign' })
  @ApiResponse({ status: 200, description: 'Failed jobs retried' })
  async retry(@Param('id') id: string) {
    return this.campaignService.retry(id);
  }

  /**
   * Retry a single failed job by index
   */
  @Post(':id/jobs/:jobIndex/retry')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Retry a single failed job by index' })
  @ApiResponse({ status: 200, description: 'Job retried successfully' })
  @ApiResponse({ status: 400, description: 'Job is not in failed state' })
  @ApiResponse({ status: 404, description: 'Campaign or job not found' })
  async retryJob(@Param('id') id: string, @Param('jobIndex') jobIndex: string) {
    return this.campaignService.retryJob(id, parseInt(jobIndex, 10));
  }

  /**
   * Update campaign configuration
   */
  @Post(':id/config')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Update campaign configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateConfig(
    @Param('id') id: string,
    @Body() config: { rpm: number; failureThreshold: number },
  ) {
    return this.campaignService.updateConfig(id, config);
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
