/**
 * Alerts Controller
 * REST API for alert management
 */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CurrentUser, RequirePermissions } from '@assureqai/auth';
import { JwtPayload, PERMISSIONS, ROLES } from '@assureqai/common';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Get paginated alerts
   */
  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get paginated alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved' })
  async getAlerts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('unreadOnly') unreadOnly = false,
    @CurrentUser() user: JwtPayload,
  ) {
    const projectId = user.role === ROLES.SUPER_ADMIN ? undefined : user.projectId;
    return this.alertsService.getAlerts(projectId, +page, +limit, String(unreadOnly) === 'true');
  }

  /**
   * Get unread count
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alert count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    const projectId = user.role === ROLES.SUPER_ADMIN ? undefined : user.projectId;
    const count = await this.alertsService.getUnreadCount(projectId);
    return { count };
  }

  /**
   * Mark alert as read
   */
  @Post(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  @ApiResponse({ status: 200, description: 'Alert marked as read' })
  async markAsRead(@Param('id') id: string) {
    await this.alertsService.markAsRead(id);
    return { success: true };
  }

  /**
   * Mark all alerts as read
   */
  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  @ApiResponse({ status: 200, description: 'All alerts marked as read' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    const projectId = user.role === ROLES.SUPER_ADMIN ? undefined : user.projectId;
    await this.alertsService.markAllAsRead(projectId);
    return { success: true };
  }

  /**
   * Acknowledge alert
   */
  @Post(':id/acknowledge')
  @RequirePermissions(PERMISSIONS.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.alertsService.acknowledgeAlert(id, user.sub);
    return { success: true };
  }
}
