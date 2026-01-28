/**
 * Roles decorator
 * Used with RolesGuard for role-based access control
 */
import { SetMetadata } from '@nestjs/common';
import { Role } from '@assureqai/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
