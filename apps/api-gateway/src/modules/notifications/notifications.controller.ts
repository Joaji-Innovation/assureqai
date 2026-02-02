/**
 * Notifications Controller
 * REST API for notification settings and webhooks
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, UpdateSettingsDto, CreateWebhookDto, UpdateWebhookDto } from './notifications.service';
import { CurrentUser, RequirePermissions } from '@assureqai/auth';
import { JwtPayload, PERMISSIONS, ROLES } from '@assureqai/common';
import { UsersService } from '../users/users.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) { }

  /**
   * Helper to resolve project ID if missing in JWT (e.g. for super admins or legacy tokens)
   */
  private async resolveProjectId(user: JwtPayload): Promise<string | null> {
    if (user.projectId) return user.projectId;

    // Try to fetch user from DB
    try {
      const dbUser = await this.usersService.findById(user.sub);
      if (dbUser.projectId) return dbUser.projectId.toString();
    } catch (e) {
      console.warn(`[NotificationsController] Failed to resolve project for user ${user.sub}`);
    }

    return null;
  }

  /**
   * Get notification settings for current project
   */
  @Get('settings')
  @RequirePermissions(PERMISSIONS.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSettings(@CurrentUser() user: JwtPayload) {
    const projectId = await this.resolveProjectId(user);
    console.log(`[NotificationsController] getSettings called for user: ${user?.username} (${user?.role}), projectId: ${projectId}`);

    if (!projectId) {
      console.warn('[NotificationsController] No projectId found for user, returning empty defaults');
      return {
        _id: 'virtual-empty',
        projectId: 'virtual',
        alertRules: [],
        smtp: { enabled: false },
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: false,
      };
    }

    const settings = await this.notificationsService.getSettings(projectId);
    console.log(`[NotificationsController] Retrieved settings for project ${user.projectId}: rules=${settings?.alertRules?.length || 0}`);
    return settings;
  }

  /**
   * Update notification settings
   */
  @Put('settings')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS) // Only managers can change settings
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSettingsDto,
  ) {
    const projectId = await this.resolveProjectId(user);
    if (!projectId) {
      return { error: 'No project associated with user' };
    }
    return this.notificationsService.updateSettings(projectId, dto);
  }

  /**
   * Get all webhooks for current project
   */
  @Get('webhooks')
  @RequirePermissions(PERMISSIONS.VIEW_ANALYTICS)
  @ApiOperation({ summary: 'Get webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved' })
  async getWebhooks(@CurrentUser() user: JwtPayload) {
    const projectId = await this.resolveProjectId(user);
    if (!projectId) {
      return [];
    }
    return this.notificationsService.getWebhooks(projectId);
  }

  /**
   * Create a new webhook
   */
  @Post('webhooks')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Create webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  async createWebhook(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWebhookDto,
  ) {
    const projectId = await this.resolveProjectId(user);
    if (!projectId) {
      return { error: 'No project associated with user' };
    }
    return this.notificationsService.createWebhook(projectId, dto);
  }

  /**
   * Update a webhook
   */
  @Put('webhooks/:id')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async updateWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.notificationsService.updateWebhook(id, dto);
  }

  /**
   * Delete a webhook
   */
  @Delete('webhooks/:id')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 204, description: 'Webhook deleted' })
  async deleteWebhook(@Param('id') id: string) {
    await this.notificationsService.deleteWebhook(id);
  }

  /**
   * Test a webhook
   */
  @Post('webhooks/:id/test')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Test webhook' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async testWebhook(@Param('id') id: string) {
    return this.notificationsService.testWebhook(id);
  }

  /**
   * Test email sending
   */
  @Post('email/test')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  @ApiOperation({ summary: 'Test email sending' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async testEmail(@Body() body: { email: string }) {
    if (!body.email) {
      return { success: false, message: 'Email is required' };
    }
    return this.notificationsService.sendTestEmail(body.email);
  }
}
