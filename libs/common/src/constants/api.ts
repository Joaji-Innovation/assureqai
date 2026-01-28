/**
 * API endpoints and configuration
 */

export const API = {
  // API versioning
  VERSION: 'v1',
  PREFIX: '/api',

  // Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: '/auth',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',

    // Users
    USERS: '/users',

    // Audits
    AUDITS: '/audits',
    AUDIT_STATS: '/audits/stats',

    // Campaigns
    CAMPAIGNS: '/campaigns',

    // Parameters
    PARAMETERS: '/parameters',

    // SOPs
    SOPS: '/sops',

    // Projects
    PROJECTS: '/projects',

    // AI
    AI_AUDIT: '/ai/qa-audit',
    AI_BULK_AUDIT: '/ai/bulk-audit',

    // Admin (Super Admin only)
    INSTANCES: '/admin/instances',
    CLIENTS: '/admin/clients',
    CREDITS: '/admin/credits',
    TEMPLATES: '/admin/templates',
    USAGE: '/admin/usage',

    // Health
    HEALTH: '/health',
    HEALTH_READY: '/health/ready',
    HEALTH_LIVE: '/health/live',
  },

  // Headers
  HEADERS: {
    INSTANCE_KEY: 'X-Instance-Key',
    RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
    RATE_LIMIT_RESET: 'X-RateLimit-Reset',
    REQUEST_ID: 'X-Request-Id',
  },

  // Response format
  RESPONSE: {
    SUCCESS: 'success',
    DATA: 'data',
    ERROR: 'error',
    MESSAGE: 'message',
    PAGINATION: 'pagination',
  },
} as const;

export type Endpoint = (typeof API.ENDPOINTS)[keyof typeof API.ENDPOINTS];
