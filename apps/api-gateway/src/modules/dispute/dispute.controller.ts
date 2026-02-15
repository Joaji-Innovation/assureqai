/**
 * Dispute Controller
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';

@ApiTags('Disputes')
@ApiBearerAuth()
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) { }

  @Post()
  @RequirePermissions(PERMISSIONS.SUBMIT_DISPUTE)
  @ApiOperation({ summary: 'Submit a dispute' })
  async create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.disputeService.create({
      ...dto,
      agentUserId: user.sub,
      agentName: user.username || user.sub,
      organizationId: user.organizationId,
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_DISPUTES)
  @ApiOperation({ summary: 'Get all disputes' })
  async findAll(
    @Query('status') status?: string,
    @Query('agentUserId') agentUserId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.disputeService.findAll({ status, agentUserId }, user?.organizationId);
  }

  @Get('stats')
  @RequirePermissions(PERMISSIONS.VIEW_DISPUTES)
  @ApiOperation({ summary: 'Get dispute stats' })
  async getStats(@CurrentUser() user?: JwtPayload) {
    return this.disputeService.getStats(user?.organizationId);
  }

  @Get('my')
  @RequirePermissions(PERMISSIONS.SUBMIT_DISPUTE)
  @ApiOperation({ summary: 'Get my disputes' })
  async getMyDisputes(@CurrentUser() user: JwtPayload) {
    return this.disputeService.findByAgent(user.sub);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_DISPUTES)
  @ApiOperation({ summary: 'Get dispute by ID' })
  async findOne(@Param('id') id: string) {
    return this.disputeService.findById(id);
  }

  @Put(':id/resolve')
  @RequirePermissions(PERMISSIONS.RESOLVE_DISPUTE)
  @ApiOperation({ summary: 'Resolve dispute' })
  async resolve(
    @Param('id') id: string,
    @Body() dto: { resolution: string; adjustedScore?: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disputeService.resolve(id, {
      ...dto,
      resolvedBy: user.sub,
    });
  }

  @Put(':id/reject')
  @RequirePermissions(PERMISSIONS.RESOLVE_DISPUTE)
  @ApiOperation({ summary: 'Reject dispute' })
  async reject(
    @Param('id') id: string,
    @Body() dto: { resolution: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.disputeService.reject(id, {
      ...dto,
      resolvedBy: user.sub,
    });
  }
}
