/**
 * Instance Module - For Admin Portal
 */
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstanceController } from './instance.controller';
import { InstanceService } from './instance.service';
import { PublicInstanceController } from './public-instance.controller';
import {
  Instance,
  InstanceSchema,
} from '../../database/schemas/instance.schema';
import { ProvisioningModule } from '../provisioning/provisioning.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Instance.name, schema: InstanceSchema },
    ]),
    forwardRef(() => ProvisioningModule),
  ],
  controllers: [InstanceController, PublicInstanceController],
  providers: [InstanceService],
  exports: [InstanceService],
})
export class InstanceModule {}
