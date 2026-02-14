/**
 * Organization Controller - Admin management of customer organizations
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
import { OrganizationService } from './organization.service';
import { RequirePermissions } from '@assureqai/auth';
import { PERMISSIONS } from '@assureqai/common';

@ApiTags('Admin - Organizations')
@ApiBearerAuth()
@Controller('admin/organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Create a new organization' })
  async create(
    @Body()
    dto: {
      name: string;
      slug?: string;
      companyName?: string;
      contactEmail: string;
      phone?: string;
      plan?: 'free' | 'starter' | 'pro' | 'enterprise';
      billingType?: 'prepaid' | 'postpaid';
      instanceId?: string;
      logo?: string;
      brandColor?: string;
      notes?: string;
      limits?: {
        maxUsers: number;
        maxProjects: number;
        maxStorage: string;
      };
    },
  ) {
    return this.organizationService.create(dto as any);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get all organizations' })
  async findAll(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('search') search?: string,
  ) {
    return this.organizationService.findAll({ status, plan, search });
  }

  @Get('with-stats')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get all organizations with usage stats' })
  async findAllWithStats() {
    return this.organizationService.getAllWithStats();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get organization details' })
  async findOne(@Param('id') id: string) {
    return this.organizationService.getDetails(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update organization' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Delete organization' })
  async delete(@Param('id') id: string) {
    return this.organizationService.delete(id);
  }

  @Put(':id/branding')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update organization branding (logo, color)' })
  async updateBranding(
    @Param('id') id: string,
    @Body() dto: { logo?: string; brandColor?: string },
  ) {
    return this.organizationService.updateBranding(id, dto);
  }

  @Put(':id/link-instance')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Link organization to an instance' })
  async linkInstance(
    @Param('id') id: string,
    @Body() dto: { instanceId: string },
  ) {
    return this.organizationService.linkInstance(id, dto.instanceId);
  }
}
