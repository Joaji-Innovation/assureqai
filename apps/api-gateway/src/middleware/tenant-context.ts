/**
 * Tenant Context — Multi-tenant scoping interfaces and helpers
 *
 * Provides a lightweight abstraction for tenant-aware request handling.
 * Used by the TenantContextMiddleware to attach org/instance context
 * to each authenticated request, and by a decorator to extract it.
 *
 * Follows SOLID: Single Responsibility — this file only defines the shape
 * of tenant context and the decorator to read it.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Tenant context attached to every authenticated request
 */
export interface TenantInfo {
  organizationId?: string;
  instanceId?: string;
  projectId?: string;
}

/**
 * Request property key where tenant info is stored
 */
export const TENANT_CONTEXT_KEY = 'tenantContext';

/**
 * Parameter decorator to extract tenant context from the request.
 * Usage: @TenantContext() tenant: TenantInfo
 */
export const TenantContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantInfo => {
    const request = ctx.switchToHttp().getRequest();
    return request[TENANT_CONTEXT_KEY] || {};
  },
);
