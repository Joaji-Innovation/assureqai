/**
 * Credit Plan Controller - Admin management of credit packages
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreditPlanService } from './credit-plan.service';
import { RequirePermissions, Public } from '@assureqai/auth';
import { PERMISSIONS } from '@assureqai/common';

@ApiTags('Credit Plans')
@ApiBearerAuth()
@Controller('admin/credit-plans')
export class CreditPlanAdminController {
  constructor(private readonly creditPlanService: CreditPlanService) { }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Create a new credit plan' })
  async create(
    @Body()
    dto: {
      name: string;
      description?: string;
      creditType: 'audit' | 'token' | 'combo';
      auditCredits?: number;
      tokenCredits?: number;
      priceUsd: number;
      priceInr?: number;
      dodoProductId?: string;
      sortOrder?: number;
      isFeatured?: boolean;
      isPopular?: boolean;
      features?: string[];
      validityDays?: number;
      maxPurchasePerMonth?: number;
    },
  ) {
    return this.creditPlanService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get all credit plans (including inactive)' })
  async findAll() {
    return this.creditPlanService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get credit plan by ID' })
  async findOne(@Param('id') id: string) {
    return this.creditPlanService.findById(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Update credit plan' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.creditPlanService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Delete credit plan' })
  async delete(@Param('id') id: string) {
    return this.creditPlanService.delete(id);
  }

  @Post(':id/toggle-active')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Toggle plan active/inactive' })
  async toggleActive(@Param('id') id: string) {
    return this.creditPlanService.toggleActive(id);
  }
}

// Public-facing controller for customers to see available plans
@ApiTags('Credit Plans')
@Controller('credit-plans')
export class CreditPlanPublicController {
  constructor(private readonly creditPlanService: CreditPlanService) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get available credit plans for purchase' })
  async getActivePlans() {
    return this.creditPlanService.getActivePlans();
  }
}
