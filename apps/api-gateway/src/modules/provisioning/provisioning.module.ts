/**
 * Provisioning Module
 */
import { Module, forwardRef } from '@nestjs/common';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { InstanceModule } from '../instance/instance.module';

@Module({
  imports: [forwardRef(() => InstanceModule)],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
  exports: [ProvisioningService],
})
export class ProvisioningModule { }
