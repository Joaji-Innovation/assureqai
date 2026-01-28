/**
 * Credits Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { Credits, CreditsSchema } from '../../database/schemas/credits.schema';
import { CreditTransaction, CreditTransactionSchema } from '../../database/schemas/credit-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Credits.name, schema: CreditsSchema },
      { name: CreditTransaction.name, schema: CreditTransactionSchema },
    ]),
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
