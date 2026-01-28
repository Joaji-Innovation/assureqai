/**
 * SOP (Standard Operating Procedure) Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SopController } from './sop.controller';
import { SopService } from './sop.service';
import { Sop, SopSchema } from '../../database/schemas/sop.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sop.name, schema: SopSchema }]),
  ],
  controllers: [SopController],
  providers: [SopService],
  exports: [SopService],
})
export class SopModule {}
