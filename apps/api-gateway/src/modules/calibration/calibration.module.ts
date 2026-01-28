/**
 * Calibration Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalibrationController } from './calibration.controller';
import { CalibrationService } from './calibration.service';
import { Calibration, CalibrationSchema } from '../../database/schemas/calibration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Calibration.name, schema: CalibrationSchema }]),
  ],
  controllers: [CalibrationController],
  providers: [CalibrationService],
  exports: [CalibrationService],
})
export class CalibrationModule {}
