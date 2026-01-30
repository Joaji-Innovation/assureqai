/**
 * Queue Module
 * Redis-based job queue with worker for bulk audit processing
 */
import { Module, Global, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueService } from './queue.service';
import { QueueWorkerService } from './queue-worker.service';
import { AiModule } from '../ai/ai.module';
import { CallAudit, CallAuditSchema } from '../../database/schemas/call-audit.schema';
import { Campaign, CampaignSchema } from '../../database/schemas/campaign.schema';
import { QAParameter, QAParameterSchema } from '../../database/schemas/qa-parameter.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallAudit.name, schema: CallAuditSchema },
      { name: Campaign.name, schema: CampaignSchema },
      { name: QAParameter.name, schema: QAParameterSchema },
    ]),
    forwardRef(() => AiModule),
  ],
  providers: [QueueService, QueueWorkerService],
  exports: [QueueService, QueueWorkerService],
})
export class QueueModule { }

