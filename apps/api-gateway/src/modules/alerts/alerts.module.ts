/**
 * Alerts Module
 * Provides real-time alert notifications via WebSocket
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsGateway } from './alerts.gateway';
import { Alert, AlertSchema } from '../../database/schemas/alert.schema';
import { AuthModule } from '@assureqai/auth';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
    AuthModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsGateway],
  exports: [AlertsService],
})
export class AlertsModule {}
