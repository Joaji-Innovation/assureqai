/**
 * Credits Controller - Admin credit management
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';

@ApiTags('Admin - Credits')
@ApiBearerAuth()
@Controller('admin/credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('initialize/:instanceId')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Initialize credits for instance' })
  async initialize(
    @Param('instanceId') instanceId: string,
    @Body() dto: {
      instanceType?: 'trial' | 'standard' | 'enterprise';
      auditCredits?: number;
      tokenCredits?: number;
      trialDays?: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.creditsService.initializeCredits(instanceId, {
      ...dto,
      createdBy: user.sub,
    });
  }

  @Get(':instanceId')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get credits for instance' })
  async getCredits(@Param('instanceId') instanceId: string) {
    return this.creditsService.getByInstance(instanceId);
  }

  @Get(':instanceId/summary')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get usage summary' })
  async getSummary(@Param('instanceId') instanceId: string) {
    return this.creditsService.getUsageSummary(instanceId);
  }

  @Post(':instanceId/audit-credits')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Add audit credits' })
  async addAuditCredits(
    @Param('instanceId') instanceId: string,
    @Body() dto: { amount: number; reason: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.creditsService.addAuditCredits(
      instanceId,
      dto.amount,
      dto.reason,
      user.sub,
    );
  }

  @Post(':instanceId/token-credits')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Add token credits' })
  async addTokenCredits(
    @Param('instanceId') instanceId: string,
    @Body() dto: { amount: number; reason: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.creditsService.addTokenCredits(
      instanceId,
      dto.amount,
      dto.reason,
      user.sub,
    );
  }

  @Post(':instanceId/type')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Update instance type' })
  async updateType(
    @Param('instanceId') instanceId: string,
    @Body() dto: { instanceType: 'trial' | 'standard' | 'enterprise' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.creditsService.updateInstanceType(
      instanceId,
      dto.instanceType,
      user.sub,
    );
  }

  @Get(':instanceId/transactions')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(
    @Param('instanceId') instanceId: string,
    @Query('creditType') creditType?: 'audit' | 'token',
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.creditsService.getTransactions(instanceId, {
      creditType,
      limit: limit || 50,
      skip: skip || 0,
    });
  }
}
