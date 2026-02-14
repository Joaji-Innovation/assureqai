/**
 * Tenant Context Interceptor
 *
 * Resolves organization and instance context from the JWT on every
 * authenticated request. Attaches a TenantInfo object for downstream
 * services/controllers to scope their queries.
 *
 * WHY an Interceptor (not Middleware)?
 *   NestJS middleware runs BEFORE guards. The JwtAuthGuard populates
 *   req.user AFTER middleware. An interceptor runs AFTER all guards,
 *   so req.user is guaranteed to be populated.
 *
 * SOLID: Single Responsibility — only populates tenant context.
 * KISS:  Reads from JWT claims (already populated at login).
 *        Zero DB lookups per request.
 * DRY:   All services read from the same TenantInfo via @TenantContext().
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TENANT_CONTEXT_KEY, TenantInfo } from './tenant-context';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantContextInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) {
      const tenantInfo: TenantInfo = {
        organizationId: user.organizationId || undefined,
        instanceId: user.instanceId || undefined,
        projectId: user.projectId || undefined,
      };

      request[TENANT_CONTEXT_KEY] = tenantInfo;
    } else {
      // Public routes — no tenant context
      request[TENANT_CONTEXT_KEY] = {};
    }

    return next.handle();
  }
}
