/**
 * Credits Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { Credits, CreditsSchema } from '../../database/schemas/credits.schema';
import { CreditTransaction, CreditTransactionSchema } from '../../database/schemas/credit-transaction.schema';
import { Instance, InstanceSchema } from '../../database/schemas/instance.schema';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Credits.name, schema: CreditsSchema },
      { name: CreditTransaction.name, schema: CreditTransactionSchema },
      { name: Instance.name, schema: InstanceSchema },
    ]),
    SettingsModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule { }
