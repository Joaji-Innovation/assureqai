/**
 * QA Parameter Controller
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QaParameterService } from './qa-parameter.service';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload, ROLES } from '@assureqai/common';

@ApiTags('QA Parameters')
@ApiBearerAuth()
@Controller('qa-parameters')
export class QaParameterController {
  constructor(private readonly qaParameterService: QaParameterService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_PARAMETERS)
  @ApiOperation({ summary: 'Create QA parameter set' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.qaParameterService.create({
      ...dto,
      projectId: user.projectId,
      createdBy: user.sub,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all QA parameter sets' })
  async findAll(@CurrentUser() user: JwtPayload) {
    // Scope to user's project
    return this.qaParameterService.findByProject(user.projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get QA parameter set by ID' })
  async findOne(@Param('id') id: string) {
    return this.qaParameterService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_PARAMETERS)
  @ApiOperation({ summary: 'Update QA parameter set' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.qaParameterService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_PARAMETERS)
  @ApiOperation({ summary: 'Delete QA parameter set' })
  async delete(@Param('id') id: string) {
    await this.qaParameterService.delete(id);
    return { success: true, message: 'QA parameter set deleted' };
  }
}
