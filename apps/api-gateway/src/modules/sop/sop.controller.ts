/**
 * SOP Controller
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SopService } from './sop.service';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload, ROLES } from '@assureqai/common';

@ApiTags('SOPs')
@ApiBearerAuth()
@Controller('sops')
export class SopController {
  constructor(private readonly sopService: SopService) { }

  @Get('templates')
  @ApiOperation({ summary: 'Get available SOP templates' })
  getTemplates() {
    return this.sopService.getTemplates();
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get a specific SOP template by ID' })
  getTemplate(@Param('templateId') templateId: string) {
    return this.sopService.getTemplate(templateId);
  }

  @Post('from-template/:templateId')
  @RequirePermissions(PERMISSIONS.MANAGE_SOPS)
  @ApiOperation({ summary: 'Create SOP from a template' })
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: { name?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sopService.createFromTemplate(
      templateId,
      user.projectId,
      user.sub,
      dto?.name,
      user.organizationId,
    );
  }

  @Post('seed-defaults')
  @RequirePermissions(PERMISSIONS.MANAGE_SOPS)
  @ApiOperation({ summary: 'Seed all default SOP templates for the project' })
  async seedDefaults(@CurrentUser() user: JwtPayload) {
    const sops = await this.sopService.seedDefaultSOPs(
      user.projectId,
      user.sub,
      user.organizationId,
    );
    return {
      success: true,
      message: `Created ${sops.length} default SOPs`,
      data: sops,
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(PERMISSIONS.MANAGE_SOPS)
  @ApiOperation({ summary: 'Upload SOP document' })
  async create(
    @UploadedFile() file: any,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sopService.create({
      ...dto,
      file,
      projectId: user.projectId,
      uploadedBy: user.sub,
      organizationId: user.organizationId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all SOPs' })
  async findAll(@CurrentUser() user: JwtPayload) {
    // Super admins see all data, others scoped to their project
    const projectId = user.role === ROLES.SUPER_ADMIN ? undefined : user.projectId;
    return this.sopService.findByProject(projectId, user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SOP by ID' })
  async findOne(@Param('id') id: string) {
    return this.sopService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_SOPS)
  @ApiOperation({ summary: 'Update SOP' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.sopService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_SOPS)
  @ApiOperation({ summary: 'Delete SOP' })
  async delete(@Param('id') id: string) {
    await this.sopService.delete(id);
    return { success: true, message: 'SOP deleted' };
  }
}

