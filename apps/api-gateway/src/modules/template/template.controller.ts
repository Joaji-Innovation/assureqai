/**
 * Template Controller - Starter templates API
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
import { TemplateService } from './template.service';
import { RequirePermissions } from '@assureqai/auth';
import { PERMISSIONS } from '@assureqai/common';

@ApiTags('Admin - Templates')
@ApiBearerAuth()
@Controller('admin/templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Create template' })
  async create(@Body() dto: any) {
    return this.templateService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get all templates' })
  async findAll(
    @Query('type') type?: string,
    @Query('industry') industry?: string,
  ) {
    return this.templateService.findAll({ type, industry });
  }

  @Get('industries')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get available industries' })
  async getIndustries() {
    return this.templateService.getIndustries();
  }

  @Get('defaults')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get default templates' })
  async getDefaults() {
    return this.templateService.findDefaults();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get template by ID' })
  async findOne(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Update template' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Delete template' })
  async delete(@Param('id') id: string) {
    await this.templateService.delete(id);
    return { success: true };
  }

  @Post('seed')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Seed default templates' })
  async seed() {
    await this.templateService.seedDefaults();
    return { success: true, message: 'Default templates seeded' };
  }
}
