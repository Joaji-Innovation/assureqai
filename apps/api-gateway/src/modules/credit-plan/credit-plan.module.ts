/**
 * Credit Plan Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CreditPlanAdminController,
  CreditPlanPublicController,
} from './credit-plan.controller';
import { CreditPlanService } from './credit-plan.service';
import {
  CreditPlan,
  CreditPlanSchema,
} from '../../database/schemas/credit-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreditPlan.name, schema: CreditPlanSchema },
    ]),
  ],
  controllers: [CreditPlanAdminController, CreditPlanPublicController],
  providers: [CreditPlanService],
  exports: [CreditPlanService],
})
export class CreditPlanModule { }
