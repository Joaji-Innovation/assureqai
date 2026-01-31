/**
 * React Query Hooks
 * Centralized data fetching with caching, refetching, and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditApi, userApi, campaignApi, queueApi, type AuditStats, type LeaderboardEntry, type Audit, type User, type Campaign } from './api';

// Query Keys - centralized for easy invalidation
export const queryKeys = {
  stats: (projectId?: string, startDate?: string, endDate?: string) => ['stats', projectId, startDate, endDate] as const,
  leaderboard: (projectId?: string, limit?: number) => ['leaderboard', projectId, limit] as const,
  audits: (filters?: Record<string, unknown>) => ['audits', filters] as const,
  audit: (id: string) => ['audit', id] as const,
  users: (page?: number, limit?: number) => ['users', page, limit] as const,
  user: (id: string) => ['user', id] as const,
  campaigns: (page?: number, limit?: number) => ['campaigns', page, limit] as const,
  campaign: (id: string) => ['campaign', id] as const,
  queueStatus: () => ['queueStatus'] as const,
};

// ============ Audit Hooks ============

export function useAuditStats(projectId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.stats(projectId, startDate, endDate),
    queryFn: () => auditApi.getStats({ projectId, startDate, endDate }),
    placeholderData: {
      total: 0,
      aiAudits: 0,
      manualAudits: 0,
      avgScore: 0,
      passRate: 0,
      failRate: 0,
      totalTokens: 0,
      fatalRate: 0,
      totalFatalErrors: 0,
      fatalAuditsCount: 0,
      ztpCount: 0,
      ztpRate: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      compliance: {
        violationCount: 0,
        avgScore: 0,
        interactionsWithIssues: 0,
        totalAuditedInteractionsForCompliance: 0,
        complianceRate: 0,
      },
      callMetrics: {
        avgTalkRatio: 0,
        avgSilence: 0,
        avgResponseTime: 0,
        avgInterruptions: 0,
      },
      escalationRisk: { high: 0, medium: 0, low: 0 },
      dailyTrend: [],
      dailyFatalTrend: [],
      topIssues: [],
      topFailingParams: [],
      paretoData: [],
      agentPerformance: { topAgents: [], underperformingAgents: [] },
      campaignPerformance: [],
      trainingNeeds: null,
      trainingNeedsList: [],
    },
  });
}

export function useLeaderboard(projectId?: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.leaderboard(projectId, limit),
    queryFn: () => auditApi.getLeaderboard(projectId, limit),
    placeholderData: [],
  });
}

export function useAudits(filters: {
  page?: number;
  limit?: number;
  agentUserId?: string;
  campaignId?: string;
  auditType?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  return useQuery({
    queryKey: queryKeys.audits(filters),
    queryFn: () => auditApi.list(filters),
    placeholderData: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
  });
}

export function useAudit(id: string) {
  return useQuery({
    queryKey: queryKeys.audit(id),
    queryFn: () => auditApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Audit>) => auditApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

// ============ User Hooks ============

export function useUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: queryKeys.users(page, limit),
    queryFn: () => userApi.list(page, limit),
    placeholderData: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; password: string; fullName?: string; email?: string; role: string }) =>
      userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ============ Campaign Hooks ============

export function useCampaigns(page = 1, limit = 10) {
  return useQuery({
    queryKey: queryKeys.campaigns(page, limit),
    queryFn: () => campaignApi.list(page, limit),
    placeholderData: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaign(id),
    queryFn: () => campaignApi.getById(id),
    enabled: !!id,
  });
}

export function useCampaignStatus(id: string) {
  return useQuery({
    queryKey: ['campaignStatus', id],
    queryFn: () => campaignApi.getStatus(id),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 2 seconds if campaign is in progress
      const data = query.state.data;
      if (data && data.status === 'in_progress') {
        return 2000;
      }
      return false;
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; jobs: Array<{ audioUrl: string; agentName?: string; callId?: string }> }) =>
      campaignApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

// ============ Queue Hooks ============

export function useQueueStatus() {
  return useQuery({
    queryKey: queryKeys.queueStatus(),
    queryFn: () => queueApi.getStatus(),
    refetchInterval: 10000, // Poll every 10 seconds
    placeholderData: { queueLength: 0, isAvailable: false },
  });
}

// ============ Notification Hooks ============

import { notificationApi, type NotificationSettings, type Webhook, type AlertRuleConfig } from './api';

export const notificationKeys = {
  settings: () => ['notificationSettings'] as const,
  webhooks: () => ['webhooks'] as const,
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: () => notificationApi.getSettings(),
    placeholderData: {
      _id: '',
      projectId: '',
      alertRules: [],
      alertRecipientEmails: [],
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: false,
    } as NotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationSettings>) => notificationApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.settings() });
    },
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: notificationKeys.webhooks(),
    queryFn: () => notificationApi.getWebhooks(),
    placeholderData: [],
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string; events: string[]; secret?: string }) =>
      notificationApi.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.webhooks() });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Webhook> }) =>
      notificationApi.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.webhooks() });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.webhooks() });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => notificationApi.testWebhook(id),
  });
}
