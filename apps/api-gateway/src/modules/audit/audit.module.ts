/**
 * Audit Module
 */
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallAudit, CallAuditSchema } from '../../database/schemas/call-audit.schema';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallAudit.name, schema: CallAuditSchema },
    ]),
    forwardRef(() => AlertsModule),
    forwardRef(() => CreditsModule),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule { }

