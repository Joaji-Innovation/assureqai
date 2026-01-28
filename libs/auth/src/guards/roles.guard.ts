/**
 * Roles Guard
 * Server-side RBAC - no client-side bypassing possible
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role, hasEqualOrHigherRole, ROLES } from '@assureqai/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required - allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: No role assigned');
    }

    const userRole = user.role as Role;

    // Super admin has access to everything
    if (userRole === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Check if user's role matches or is higher than any required role
    const hasAccess = requiredRoles.some((requiredRole) =>
      hasEqualOrHigherRole(userRole, requiredRole),
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied: Requires one of [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
