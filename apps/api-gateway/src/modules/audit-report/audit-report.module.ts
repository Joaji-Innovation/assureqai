/**
 * Audit Report Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditReportController } from './audit-report.controller';
import { AuditReportService } from './audit-report.service';
import { UsageReporterService } from './usage-reporter.service';
import { AuditReport, AuditReportSchema } from '../../database/schemas/audit-report.schema';
import { Instance, InstanceSchema } from '../../database/schemas/instance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditReport.name, schema: AuditReportSchema },
      { name: Instance.name, schema: InstanceSchema },
    ]),
  ],
  controllers: [AuditReportController],
  providers: [AuditReportService, UsageReporterService],
  exports: [AuditReportService, UsageReporterService],
})
export class AuditReportModule { }
