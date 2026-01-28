/**
 * QA Parameters Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QaParameterController } from './qa-parameter.controller';
import { QaParameterService } from './qa-parameter.service';
import { QAParameter, QAParameterSchema } from '../../database/schemas/qa-parameter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: QAParameter.name, schema: QAParameterSchema }]),
  ],
  controllers: [QaParameterController],
  providers: [QaParameterService],
  exports: [QaParameterService],
})
export class QaParameterModule {}
