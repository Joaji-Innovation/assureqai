/**
 * User roles and permissions
 * RBAC (Role-Based Access Control) configuration
 */

export const ROLES = {
  // Platform level
  SUPER_ADMIN: 'super_admin',

  // Instance level
  CLIENT_ADMIN: 'client_admin',
  MANAGER: 'manager',
  QA_ANALYST: 'qa_analyst',
  AUDITOR: 'auditor',
  AGENT: 'agent',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy - higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.CLIENT_ADMIN]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.QA_ANALYST]: 40,
  [ROLES.AUDITOR]: 30,
  [ROLES.AGENT]: 10,
};

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // Instance Management (Super Admin only)
  MANAGE_INSTANCES: 'manage_instances',
  VIEW_INSTANCES: 'view_instances',
  MANAGE_CLIENTS: 'manage_clients',
  MANAGE_CREDITS: 'manage_credits',
  VIEW_ALL_USAGE: 'view_all_usage',
  SSH_ACCESS: 'ssh_access',

  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',

  // Audit Management
  PERFORM_AUDIT: 'perform_audit',
  VIEW_ALL_AUDITS: 'view_all_audits',
  VIEW_OWN_AUDITS: 'view_own_audits',
  DELETE_AUDITS: 'delete_audits',

  // Campaign Management
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  VIEW_CAMPAIGNS: 'view_campaigns',

  // Parameters & SOPs
  MANAGE_PARAMETERS: 'manage_parameters',
  MANAGE_SOPS: 'manage_sops',
  VIEW_PARAMETERS: 'view_parameters',
  VIEW_SOPS: 'view_sops',

  // Disputes
  SUBMIT_DISPUTE: 'submit_dispute',
  RESOLVE_DISPUTE: 'resolve_dispute',
  VIEW_DISPUTES: 'view_disputes',

  // Reports
  GENERATE_REPORTS: 'generate_reports',
  VIEW_ANALYTICS: 'view_analytics',

  // Agent specific
  VIEW_OWN_PERFORMANCE: 'view_own_performance',
  ACKNOWLEDGE_FEEDBACK: 'acknowledge_feedback',
  
  // Settings
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role to Permissions mapping
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.CLIENT_ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.PERFORM_AUDIT,
    PERMISSIONS.VIEW_ALL_AUDITS,
    PERMISSIONS.DELETE_AUDITS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.MANAGE_PARAMETERS,
    PERMISSIONS.MANAGE_SOPS,
    PERMISSIONS.VIEW_PARAMETERS,
    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.RESOLVE_DISPUTE,
    PERMISSIONS.VIEW_DISPUTES,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],

  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.PERFORM_AUDIT,
    PERMISSIONS.VIEW_ALL_AUDITS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.VIEW_PARAMETERS,
    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.RESOLVE_DISPUTE,
    PERMISSIONS.VIEW_DISPUTES,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],

  [ROLES.QA_ANALYST]: [
    PERMISSIONS.PERFORM_AUDIT,
    PERMISSIONS.VIEW_ALL_AUDITS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.VIEW_PARAMETERS,
    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.VIEW_DISPUTES,
    PERMISSIONS.VIEW_ANALYTICS,
  ],

  [ROLES.AUDITOR]: [
    PERMISSIONS.PERFORM_AUDIT,
    PERMISSIONS.VIEW_ALL_AUDITS,
    PERMISSIONS.VIEW_PARAMETERS,
    PERMISSIONS.VIEW_SOPS,
  ],

  [ROLES.AGENT]: [
    PERMISSIONS.VIEW_OWN_AUDITS,
    PERMISSIONS.VIEW_OWN_PERFORMANCE,
    PERMISSIONS.SUBMIT_DISPUTE,
    PERMISSIONS.ACKNOWLEDGE_FEEDBACK,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Check if roleA has equal or higher privileges than roleB
 */
export function hasEqualOrHigherRole(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}
