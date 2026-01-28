/**
 * Backup Service - MongoDB backup and restore operations
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Backup, BackupDocument } from '../../database/schemas/backup.schema';
import { NodeSSH } from 'node-ssh';

export interface BackupResult {
  success: boolean;
  backupId?: string;
  filename?: string;
  sizeBytes?: number;
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    @InjectModel(Backup.name) private backupModel: Model<BackupDocument>,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new backup for an instance
   */
  async createBackup(instanceId: string, options: {
    vpsHost: string;
    vpsPort?: number;
    vpsUser: string;
    sshKey?: string;
    createdBy?: string;
  }): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${instanceId}-${timestamp}.gz`;

    // Create backup record
    const backup = await this.backupModel.create({
      instanceId: new Types.ObjectId(instanceId),
      filename,
      sizeBytes: 0,
      status: 'in_progress',
      type: 'manual',
      startedAt: new Date(),
      createdBy: options.createdBy,
    });

    const ssh = new NodeSSH();

    try {
      // Connect to VPS
      await ssh.connect({
        host: options.vpsHost,
        port: options.vpsPort || 22,
        username: options.vpsUser,
        privateKey: options.sshKey,
      });

      // Execute mongodump inside container
      const { stdout, stderr } = await ssh.execCommand(
        `docker exec assureqai-mongo mongodump --archive=/tmp/${filename} --gzip --db ${instanceId}`
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(stderr);
      }

      // Get backup size
      const { stdout: sizeOutput } = await ssh.execCommand(
        `docker exec assureqai-mongo stat -c%s /tmp/${filename} 2>/dev/null || echo "0"`
      );
      const sizeBytes = parseInt(sizeOutput.trim()) || 0;

      // Copy backup to local backup directory
      await ssh.execCommand(
        `docker cp assureqai-mongo:/tmp/${filename} /opt/assureqai/backups/${filename}`
      );

      // Clean up container temp file
      await ssh.execCommand(`docker exec assureqai-mongo rm /tmp/${filename}`);

      ssh.dispose();

      // Update backup record
      await this.backupModel.findByIdAndUpdate(backup._id, {
        status: 'completed',
        sizeBytes,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return {
        success: true,
        backupId: backup._id.toString(),
        filename,
        sizeBytes,
      };

    } catch (error) {
      ssh.dispose();
      
      await this.backupModel.findByIdAndUpdate(backup._id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      });

      return {
        success: false,
        backupId: backup._id.toString(),
        error: error.message,
      };
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupId: string, options: {
    vpsHost: string;
    vpsPort?: number;
    vpsUser: string;
    sshKey?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const backup = await this.backupModel.findById(backupId).exec();
    if (!backup) {
      throw new NotFoundException(`Backup ${backupId} not found`);
    }

    if (backup.status !== 'completed') {
      return { success: false, error: 'Backup is not in completed status' };
    }

    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: options.vpsHost,
        port: options.vpsPort || 22,
        username: options.vpsUser,
        privateKey: options.sshKey,
      });

      // Copy backup to container
      await ssh.execCommand(
        `docker cp /opt/assureqai/backups/${backup.filename} assureqai-mongo:/tmp/${backup.filename}`
      );

      // Restore
      const { stderr } = await ssh.execCommand(
        `docker exec assureqai-mongo mongorestore --archive=/tmp/${backup.filename} --gzip --drop`
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(stderr);
      }

      // Cleanup
      await ssh.execCommand(`docker exec assureqai-mongo rm /tmp/${backup.filename}`);

      ssh.dispose();

      return { success: true };

    } catch (error) {
      ssh.dispose();
      return { success: false, error: error.message };
    }
  }

  /**
   * List backups for an instance
   */
  async findByInstance(instanceId: string): Promise<Backup[]> {
    return this.backupModel
      .find({ instanceId: new Types.ObjectId(instanceId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get backup by ID
   */
  async findById(id: string): Promise<Backup> {
    const backup = await this.backupModel.findById(id).exec();
    if (!backup) throw new NotFoundException(`Backup ${id} not found`);
    return backup;
  }

  /**
   * Delete a backup
   */
  async delete(id: string, options: {
    vpsHost: string;
    vpsPort?: number;
    vpsUser: string;
    sshKey?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const backup = await this.findById(id);

    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: options.vpsHost,
        port: options.vpsPort || 22,
        username: options.vpsUser,
        privateKey: options.sshKey,
      });

      // Delete backup file
      await ssh.execCommand(`rm -f /opt/assureqai/backups/${backup.filename}`);

      ssh.dispose();

      // Delete record
      await this.backupModel.findByIdAndDelete(id).exec();

      return { success: true };

    } catch (error) {
      ssh.dispose();
      return { success: false, error: error.message };
    }
  }

  /**
   * Get backup stats
   */
  async getStats(instanceId?: string): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackup?: Date;
  }> {
    const query = instanceId ? { instanceId: new Types.ObjectId(instanceId) } : {};
    
    const [stats] = await this.backupModel.aggregate([
      { $match: { ...query, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalBackups: { $sum: 1 },
          totalSize: { $sum: '$sizeBytes' },
          lastBackup: { $max: '$completedAt' },
        },
      },
    ]);

    return stats || { totalBackups: 0, totalSize: 0 };
  }

  /**
   * Cleanup expired backups
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.backupModel.deleteMany({
      expiresAt: { $lt: new Date() },
    }).exec();

    return result.deletedCount;
  }
}
