/**
 * Payment Module
 */
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentController,
  PaymentAdminController,
  WebhookController,
} from './payment.controller';
import { PaymentService } from './payment.service';
import {
  Payment,
  PaymentSchema,
} from '../../database/schemas/payment.schema';
import {
  Organization,
  OrganizationSchema,
} from '../../database/schemas/organization.schema';
import { CreditsModule } from '../credits/credits.module';
import { CreditPlanModule } from '../credit-plan/credit-plan.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    forwardRef(() => CreditsModule),
    CreditPlanModule,
  ],
  controllers: [PaymentController, PaymentAdminController, WebhookController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule { }
