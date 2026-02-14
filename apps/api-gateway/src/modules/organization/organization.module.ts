/**
 * Organization Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import {
  Organization,
  OrganizationSchema,
} from '../../database/schemas/organization.schema';
import {
  Instance,
  InstanceSchema,
} from '../../database/schemas/instance.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Instance.name, schema: InstanceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule { }
