/**
 * Feature flags for build-time separation
 * Super Admin builds include all features
 * Client builds exclude admin-only features
 */

export const FEATURES = {
  // Super Admin Only - NOT included in client builds
  INSTANCE_MANAGEMENT: 'INSTANCE_MANAGEMENT',
  GLOBAL_USAGE_ANALYTICS: 'GLOBAL_USAGE_ANALYTICS',
  TOKEN_ANALYTICS: 'TOKEN_ANALYTICS',
  SSH_DEPLOYMENT: 'SSH_DEPLOYMENT',
  CLIENT_BILLING_MANAGEMENT: 'CLIENT_BILLING_MANAGEMENT',
  ANNOUNCEMENTS: 'ANNOUNCEMENTS',
  ADMIN_AUDIT_TRAIL: 'ADMIN_AUDIT_TRAIL',
  CREDIT_MANAGEMENT: 'CREDIT_MANAGEMENT',
  TEMPLATE_MANAGEMENT: 'TEMPLATE_MANAGEMENT',

  // Client Instance Features
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  QA_AUDIT: 'QA_AUDIT',
  BULK_AUDIT: 'BULK_AUDIT',
  MANUAL_AUDIT: 'MANUAL_AUDIT',
  REPORTS: 'REPORTS',
  PARAMETER_MANAGEMENT: 'PARAMETER_MANAGEMENT',
  SOP_MANAGEMENT: 'SOP_MANAGEMENT',
  CAMPAIGNS: 'CAMPAIGNS',
  DISPUTES: 'DISPUTES',
  CALIBRATION: 'CALIBRATION',
  LEADERBOARD: 'LEADERBOARD',
  ANALYTICS: 'ANALYTICS',
  COMPLIANCE: 'COMPLIANCE',
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Build profiles determine which features are included
 */
export const BUILD_PROFILES = {
  SUPER_ADMIN: [
    FEATURES.INSTANCE_MANAGEMENT,
    FEATURES.GLOBAL_USAGE_ANALYTICS,
    FEATURES.TOKEN_ANALYTICS,
    FEATURES.SSH_DEPLOYMENT,
    FEATURES.CLIENT_BILLING_MANAGEMENT,
    FEATURES.ANNOUNCEMENTS,
    FEATURES.ADMIN_AUDIT_TRAIL,
    FEATURES.CREDIT_MANAGEMENT,
    FEATURES.TEMPLATE_MANAGEMENT,
  ],

  CLIENT_INSTANCE: [
    FEATURES.USER_MANAGEMENT,
    FEATURES.QA_AUDIT,
    FEATURES.BULK_AUDIT,
    FEATURES.MANUAL_AUDIT,
    FEATURES.REPORTS,
    FEATURES.PARAMETER_MANAGEMENT,
    FEATURES.SOP_MANAGEMENT,
    FEATURES.CAMPAIGNS,
    FEATURES.DISPUTES,
    FEATURES.CALIBRATION,
    FEATURES.LEADERBOARD,
    FEATURES.ANALYTICS,
    FEATURES.COMPLIANCE,
  ],
} as const;

export type BuildProfile = keyof typeof BUILD_PROFILES;

/**
 * Check if a feature is enabled in current build
 */
export function isFeatureEnabled(feature: string): boolean {
  const profile = process.env.BUILD_PROFILE as BuildProfile | undefined;
  if (!profile) return true; // Default to all features in dev

  const enabledFeatures = BUILD_PROFILES[profile] as readonly string[] | undefined;
  return enabledFeatures?.includes(feature) ?? false;
}
