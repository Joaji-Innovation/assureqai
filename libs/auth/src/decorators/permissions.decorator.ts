/**
 * Permissions decorator
 * Used with PermissionsGuard for permission-based access control
 */
import { SetMetadata } from '@nestjs/common';
import { Permission } from '@assureqai/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
