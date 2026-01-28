/**
 * System limits and quotas
 * Centralized configuration - no magic numbers in code
 */

export const LIMITS = {
  // Audio Processing
  MAX_AUDIO_SIZE_MB: 100,
  MAX_AUDIO_DURATION_MINUTES: 60,
  SUPPORTED_AUDIO_FORMATS: ['wav', 'mp3', 'webm', 'ogg', 'm4a'],

  // Bulk Audit
  MAX_BULK_ROWS: 10000,
  BULK_BATCH_SIZE: 50,

  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,
  DASHBOARD_AUDIT_LIMIT: 100,

  // Rate Limiting
  LOGIN_ATTEMPTS_PER_MINUTE: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
  API_REQUESTS_PER_MINUTE: 100,
  API_REQUESTS_PER_HOUR: 1000,

  // AI / Gemini
  GEMINI_RPM: 10,
  GEMINI_RPH: 500,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,

  // Cache TTL (seconds)
  CACHE_TTL_STATS: 300, // 5 minutes
  CACHE_TTL_USER: 3600, // 1 hour
  CACHE_TTL_TEMPLATE: 3600, // 1 hour
  CACHE_TTL_LEADERBOARD: 900, // 15 minutes

  // Timeouts (milliseconds)
  API_TIMEOUT_MS: 30000,
  SSH_TIMEOUT_MS: 60000,
  AI_AUDIT_TIMEOUT_MS: 120000,
  HEALTH_CHECK_TIMEOUT_MS: 10000,

  // Instance Defaults
  DEFAULT_AUDIT_CREDITS: 1000,
  DEFAULT_TOKEN_CREDITS: 500000,
  DEFAULT_USER_LIMIT: 25,
  DEFAULT_TRIAL_DAYS: 14,

  // Reporting
  HEARTBEAT_INTERVAL_MS: 60000, // 1 minute
  USAGE_REPORT_INTERVAL_MS: 3600000, // 1 hour
  HEALTH_REPORT_INTERVAL_MS: 300000, // 5 minutes

  // Low Balance Threshold
  LOW_CREDIT_THRESHOLD_PERCENT: 20,

  // Worker
  WORKER_CONCURRENCY: 2,
  WORKER_POLL_INTERVAL_MS: 5000,
} as const;

export type LimitKey = keyof typeof LIMITS;
