/**
 * Common interfaces used across services
 */

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface JwtPayload {
  sub: string; // User ID
  username: string;
  email?: string;
  role: string;
  projectId?: string;
  organizationId?: string;
  instanceId?: string;
  iat?: number;
  exp?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    database: boolean;
    redis: boolean;
    ai?: boolean;
  };
}

export interface UsageReport {
  instanceId: string;
  period: string; // "2026-01"
  audits: {
    total: number;
    ai: number;
    manual: number;
  };
  tokens: {
    used: number;
    remaining: number;
  };
  users: {
    active: number;
    total: number;
  };
  apiCalls: number;
}

export interface CreditBalance {
  auditCredits: number;
  tokenCredits: number;
  totalAuditCredits: number;
  totalTokenCredits: number;
  expiresAt?: Date;
}
