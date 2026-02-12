/**
 * Usage Tracking Interceptor
 * Runs on every API request, increments the API call counter for the instance.
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsageTrackingService } from './usage-tracking.service';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  constructor(private readonly usageTracking: UsageTrackingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Fire-and-forget: just bump the in-memory counter
    this.usageTracking.trackApiCall();
    return next.handle();
  }
}
