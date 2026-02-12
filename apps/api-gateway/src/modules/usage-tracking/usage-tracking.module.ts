/**
 * Usage Tracking Module
 * Resolves instance by API key and tracks all API calls globally.
 * Also exports UsageTrackingService so other modules (audit, queue)
 * can get the resolved instanceId for credit deduction.
 */
import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Instance,
  InstanceSchema,
} from '../../database/schemas/instance.schema';
import { UsageTrackingService } from './usage-tracking.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Instance.name, schema: InstanceSchema },
    ]),
  ],
  providers: [UsageTrackingService],
  exports: [UsageTrackingService],
})
export class UsageTrackingModule {}
