/**
 * Validation rules for input fields
 * Used by DTOs and frontend form validation
 */

export const VALIDATION = {
  // User fields
  USERNAME_MIN: 3,
  USERNAME_MAX: 50,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,

  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,

  EMAIL_MAX: 255,
  FULL_NAME_MAX: 100,

  // Agent fields
  AGENT_NAME_MAX: 100,
  AGENT_ID_MAX: 50,

  // Campaign fields
  CAMPAIGN_NAME_MAX: 100,
  CAMPAIGN_DESCRIPTION_MAX: 500,

  // SOP fields
  SOP_NAME_MAX: 100,
  SOP_CONTENT_MAX: 50000,

  // Parameter fields
  PARAMETER_NAME_MAX: 100,
  PARAMETER_SET_NAME_MAX: 100,

  // Project fields
  PROJECT_NAME_MAX: 100,
  PROJECT_DESCRIPTION_MAX: 500,

  // Instance fields
  SUBDOMAIN_MIN: 3,
  SUBDOMAIN_MAX: 50,
  SUBDOMAIN_PATTERN: /^[a-z0-9-]+$/,

  // Audit fields
  CALL_ID_MAX: 100,
  COMMENTS_MAX: 1000,
  TRANSCRIPT_MAX: 100000,
  SUMMARY_MAX: 5000,

  // API Key
  API_KEY_PREFIX: 'aq_',
  API_KEY_LENGTH: 32,
} as const;

export type ValidationKey = keyof typeof VALIDATION;
