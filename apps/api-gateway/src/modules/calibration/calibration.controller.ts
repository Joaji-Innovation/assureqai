/**
 * Calibration Controller
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
import { CalibrationService } from './calibration.service';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';

@ApiTags('Calibration')
@ApiBearerAuth()
@Controller('calibrations')
export class CalibrationController {
  constructor(private readonly calibrationService: CalibrationService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Create calibration session' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.calibrationService.create({
      ...dto,
      createdBy: user.sub,
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_CAMPAIGNS)
  @ApiOperation({ summary: 'Get all calibration sessions' })
  async findAll(@Query('status') status?: string) {
    return this.calibrationService.findAll(status);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_CAMPAIGNS)
  @ApiOperation({ summary: 'Get calibration by ID' })
  async findOne(@Param('id') id: string) {
    return this.calibrationService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Update calibration' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.calibrationService.update(id, dto);
  }

  @Post(':id/start')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Start calibration session' })
  async start(@Param('id') id: string) {
    return this.calibrationService.start(id);
  }

  @Post(':id/score')
  @RequirePermissions(PERMISSIONS.PERFORM_AUDIT)
  @ApiOperation({ summary: 'Submit evaluator score' })
  async submitScore(
    @Param('id') id: string,
    @Body() dto: { score: number; parameterScores?: Record<string, number>; comments?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.calibrationService.submitScore(id, {
      evaluatorId: user.sub,
      evaluatorName: user.username || user.sub,
      ...dto,
    });
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Complete calibration session' })
  async complete(@Param('id') id: string) {
    return this.calibrationService.complete(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CAMPAIGNS)
  @ApiOperation({ summary: 'Delete calibration' })
  async delete(@Param('id') id: string) {
    await this.calibrationService.delete(id);
    return { success: true };
  }
}
