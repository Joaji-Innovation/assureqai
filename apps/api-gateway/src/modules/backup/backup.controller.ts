/**
 * Backup Controller
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { RequirePermissions, CurrentUser } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';
import { InstanceService } from '../instance/instance.service';

@ApiTags('Admin - Backups')
@ApiBearerAuth()
@Controller('admin/backups')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly instanceService: InstanceService,
  ) {}

  @Post('instance/:instanceId')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Create backup for instance' })
  async createBackup(
    @Param('instanceId') instanceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const instance = await this.instanceService.findById(instanceId);
    
    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    return this.backupService.createBackup(instanceId, {
      vpsHost: instance.vps.host,
      vpsPort: instance.vps.sshPort || 22,
      vpsUser: instance.vps.sshUser,
      createdBy: user.sub,
    });
  }

  @Get('instance/:instanceId')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'List backups for instance' })
  async listBackups(@Param('instanceId') instanceId: string) {
    return this.backupService.findByInstance(instanceId);
  }

  @Get('stats')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get backup stats' })
  async getStats() {
    return this.backupService.getStats();
  }

  @Get('stats/:instanceId')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get backup stats for instance' })
  async getInstanceStats(@Param('instanceId') instanceId: string) {
    return this.backupService.getStats(instanceId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_INSTANCES)
  @ApiOperation({ summary: 'Get backup by ID' })
  async getBackup(@Param('id') id: string) {
    return this.backupService.findById(id);
  }

  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Restore from backup' })
  async restoreBackup(@Param('id') id: string) {
    const backup = await this.backupService.findById(id);
    const instance = await this.instanceService.findById(backup.instanceId.toString());
    
    if (!instance.vps?.host) {
      return { success: false, error: 'No VPS configuration found' };
    }

    return this.backupService.restoreBackup(id, {
      vpsHost: instance.vps.host,
      vpsPort: instance.vps.sshPort || 22,
      vpsUser: instance.vps.sshUser,
    });
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SSH_ACCESS)
  @ApiOperation({ summary: 'Delete backup' })
  async deleteBackup(@Param('id') id: string) {
    const backup = await this.backupService.findById(id);
    const instance = await this.instanceService.findById(backup.instanceId.toString());
    
    if (!instance.vps?.host) {
      // If no VPS, just delete the record
      return { success: true };
    }

    return this.backupService.delete(id, {
      vpsHost: instance.vps.host,
      vpsPort: instance.vps.sshPort || 22,
      vpsUser: instance.vps.sshUser,
    });
  }

  @Post('cleanup')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTANCES)
  @ApiOperation({ summary: 'Cleanup expired backups' })
  async cleanupExpired() {
    const count = await this.backupService.cleanupExpired();
    return { success: true, deletedCount: count };
  }
}
