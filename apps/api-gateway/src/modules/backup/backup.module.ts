/**
 * Backup Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { Backup, BackupSchema } from '../../database/schemas/backup.schema';
import { InstanceModule } from '../instance/instance.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Backup.name, schema: BackupSchema }]),
    InstanceModule,
  ],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
