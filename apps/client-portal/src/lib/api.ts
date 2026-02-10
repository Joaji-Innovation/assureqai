/**
 * API Service Layer
 * Centralized API calls with error handling
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Add Bearer token if available (Dual auth support: Cookie + Header)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      if (!fetchOptions.headers) {
        fetchOptions.headers = {};
      }
      (fetchOptions.headers as any)['Authorization'] = `Bearer ${token}`;
    }
  }

  // Prepare headers
  const headers = { ...fetchOptions.headers } as Record<string, string>;

  // Only set Content-Type to application/json if body is NOT FormData
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// User interface
export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  projectId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Auth APIs
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    request<{ user: Partial<User>; accessToken: string }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () => request('/api/users/logout', { method: 'POST' }),
  me: () => request<User>('/api/users/me'),
};

export const instanceApi = {
  getStatus: () => request<{ usageReportingEnabled: boolean; hasAdminUrl: boolean; hasInstanceApiKey: boolean }>('/api/instance/status'),
};

// Audit APIs
export interface AuditStats {
  total: number;
  aiAudits: number;
  manualAudits: number;
  avgScore: number; // overallQAScore
  passRate: number;
  failRate: number;
  totalTokens: number;

  // Fatal errors & ZTP
  fatalRate: number;
  totalFatalErrors: number;
  fatalAuditsCount: number;
  ztpCount: number;
  ztpRate: number;

  // Sentiment
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };

  // Compliance
  compliance: {
    violationCount: number;
    avgScore: number;
    interactionsWithIssues: number;
    totalAuditedInteractionsForCompliance: number;
    complianceRate: number;
  };

  // Call Metrics
  callMetrics: {
    avgTalkRatio: number;
    avgSilence: number;
    avgResponseTime: number;
    avgInterruptions: number;
  };

  // Escalation Risk
  escalationRisk: {
    high: number;
    medium: number;
    low: number;
  };

  // Charts & Listeners
  dailyTrend: {
    date: string;
    audits: number;
    count?: number; // legacy
    avgScore: number;
    passRate: number;
  }[];

  dailyFatalTrend: {
    date: string;
    fatalErrors: number;
  }[];

  topIssues: {
    id: string;
    reason: string;
    count: number;
    critical: boolean;
    avgScore: number;
    suggestion?: string;
    subParameters?: any[];
  }[]; // Alias for topFailingParams with UI fields

  topFailingParams: {
    parameterName: string;
    count: number;
    critical: boolean;
    avgScore: number;
    type?: string;
  }[];

  paretoData: {
    parameter: string;
    count: number;
    frequencyPercentage: number;
    cumulative: number;
    percentage: number;
  }[];

  // Performance Analysis
  agentPerformance: {
    topAgents: {
      id: string;
      name: string;
      score: number;
      audits: number;
      pass: number;
      fail: number;
    }[];
    underperformingAgents: {
      id: string;
      name: string;
      agentName?: string;
      score: number;
      audits: number;
      pass: number;
      fail: number;
      lowestParam: string;
      lowestParamScore: number;
    }[];
  };

  campaignPerformance: {
    name: string;
    avgScore: number; // score
    score?: number;
    compliance: number;
    audits: number;
  }[];

  trainingNeeds: {
    agentName: string;
    lowestParam: string;
  } | null;

  trainingNeedsList: {
    agentName: string;
    agentId: string;
    score: number;
    lowestParam: string;
    lowestParamScore: number;
  }[];
}

// Evidence citation from transcript
export interface EvidenceCitation {
  text: string;
  lineNumber?: number;
  startChar?: number;
  endChar?: number;
}

// Audit timing metrics
export interface AuditTiming {
  startTime: string;
  endTime: string;
  processingDurationMs: number;
  promptTokensPerSecond?: number;
}

export interface AuditResult {
  parameterName: string;
  parameterId?: string;
  score: number;
  maxScore: number;
  weight?: number;
  comments: string;
  type: string;
  confidence?: number; // 0-100 confidence score
  evidence?: EvidenceCitation[]; // Transcript citations
  subResults?: {
    subParameterName: string;
    score: number;
    weight?: number;
    comments?: string;
    confidence?: number;
    evidence?: EvidenceCitation[];
  }[];
}

export interface Audit {
  _id: string;
  id?: string; // Mongoose alias
  agentName: string;
  agentUserId?: string;
  callId?: string;
  campaignName?: string;
  projectId?: string;
  auditType: 'ai' | 'manual' | 'bulk';
  overallScore: number;
  overallConfidence?: number; // Overall AI confidence
  maxPossibleScore?: number;
  createdAt: string;
  updatedAt?: string;
  auditedBy?: string;

  // Data fields
  transcript?: string;
  englishTranslation?: string;
  additionalTranslation?: string;
  additionalTranslationLanguage?: string;
  callSummary?: string;
  rootCauseAnalysis?: string;
  auditDurationMs?: number;
  audioUrl?: string;

  auditResults: AuditResult[];

  metrics?: {
    talkToListenRatio?: number;
    silencePercentage?: number;
    holdTime?: number;
    callDuration?: number;
  };

  compliance?: {
    keywordsDetected: string[];
    violations: { rule: string; description: string; severity: string }[];
    complianceScore: number;
  };

  coaching?: {
    strengths: string[];
    improvements: string[];
    suggestedActions: string[];
  };

  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  timing?: AuditTiming; // Processing timing metrics

  disputeStatus?: string;
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
  };
}

export interface LeaderboardEntry {
  agentUserId: string;
  agentName: string;
  totalAudits: number;
  avgScore: number;
  passRate: number;
}

export const auditApi = {
  getStats: (filters?: Record<string, string | number | undefined>) =>
    request<AuditStats>('/api/audits/stats', { params: filters }),

  getLeaderboard: (projectId?: string, limit = 10) =>
    request<LeaderboardEntry[]>('/api/audits/leaderboard', {
      params: { projectId, limit },
    }),

  list: (filters: {
    page?: number;
    limit?: number;
    agentUserId?: string;
    campaignId?: string;
    auditType?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    request<{
      data: Audit[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/api/audits', {
      params: filters as Record<string, string | number | undefined>,
    }),

  getById: (id: string) => request<Audit>(`/api/audits/${id}`),

  create: (data: Partial<Audit>) =>
    request<Audit>('/api/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/audits/${id}`, { method: 'DELETE' }),
};

// QA Parameter APIs
export interface QAParameter {
  _id: string;
  id: string; // Mongoose alias - Making required for UI compatibility
  name: string;
  description: string;
  isActive: boolean;
  parameters: any[];
  createdAt?: string;
  updatedAt?: string;
  lastModified: string;
}

export const qaParameterApi = {
  list: () => request<QAParameter[]>('/api/qa-parameters'),

  getById: (id: string) => request<QAParameter>(`/api/qa-parameters/${id}`),

  create: (data: Partial<QAParameter>) =>
    request<QAParameter>('/api/qa-parameters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<QAParameter>) =>
    request<QAParameter>(`/api/qa-parameters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/qa-parameters/${id}`, { method: 'DELETE' }),

  // Template methods
  getTemplates: () =>
    request<{ id: string; name: string; description: string }[]>(
      '/api/qa-parameters/templates',
    ),

  getTemplate: (templateId: string) =>
    request<{ name: string; description: string; parameters: any[] }>(
      `/api/qa-parameters/templates/${templateId}`,
    ),

  createFromTemplate: (templateId: string, name?: string) =>
    request<QAParameter>(`/api/qa-parameters/from-template/${templateId}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  seedDefaults: () =>
    request<{ success: boolean; message: string; data: QAParameter[] }>(
      '/api/qa-parameters/seed-defaults',
      {
        method: 'POST',
      },
    ),
};

// Campaign APIs
export interface Campaign {
  _id: string;
  name: string;
  description?: string;
  status:
    | 'pending'
    | 'processing'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'paused';
  config: {
    rpm: number;
    failureThreshold: number;
  };
  usage: {
    lastJobStartedAt?: string;
  };
  language?: string;
  transcriptionLanguage?: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  qaParameterSetId?: string;
  projectId?: string;
  createdBy?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  jobs?: {
    audioUrl: string;
    agentName?: string;
    callId?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    auditId?: string;
    error?: string;
  }[];
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  qaParameterSetId: string;
  projectId?: string;
  applyRateLimit?: boolean;
  language?: string;
  transcriptionLanguage?: string;
  jobs: Array<{ audioUrl: string; agentName?: string; callId?: string }>;
}

export const campaignApi = {
  list: (page = 1, limit = 10) =>
    request<{
      data: Campaign[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/api/campaigns', {
      params: { page, limit },
    }),

  getById: (id: string) => request<Campaign>(`/api/campaigns/${id}`),

  create: (data: CreateCampaignPayload) =>
    request<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    request<Campaign>(`/api/campaigns/${id}/cancel`, { method: 'PUT' }),

  delete: (id: string) =>
    request<void>(`/api/campaigns/${id}`, { method: 'DELETE' }),

  getStatus: (id: string) =>
    request<{
      status: string;
      progress: number;
      completedJobs: number;
      totalJobs: number;
    }>(`/api/campaigns/${id}/status`),

  uploadFile: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>(`/api/campaigns/${id}/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  pause: (id: string) =>
    request<Campaign>(`/api/campaigns/${id}/pause`, { method: 'PUT' }),

  resume: (id: string) =>
    request<Campaign>(`/api/campaigns/${id}/resume`, { method: 'PUT' }),

  retry: (id: string) =>
    request<Campaign>(`/api/campaigns/${id}/retry`, { method: 'POST' }),

  retryJob: (id: string, jobIndex: number) =>
    request<Campaign>(`/api/campaigns/${id}/jobs/${jobIndex}/retry`, {
      method: 'POST',
    }),

  updateConfig: (
    id: string,
    config: { rpm: number; failureThreshold: number },
  ) =>
    request<Campaign>(`/api/campaigns/${id}/config`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
};

// User APIs - interface defined above

export const userApi = {
  list: (page = 1, limit = 10) =>
    request<{
      data: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/api/users', {
      params: { page, limit },
    }),

  getById: (id: string) => request<User>(`/api/users/${id}`),

  create: (data: {
    username: string;
    password: string;
    fullName?: string;
    email?: string;
    role: string;
  }) =>
    request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<User>) =>
    request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/users/${id}`, { method: 'DELETE' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Queue APIs
export const queueApi = {
  getStatus: () =>
    request<{ queueLength: number; isAvailable: boolean }>('/api/queue/status'),
};

export const aiApi = {
  chat: (message: string, context?: any) =>
    request<{ response: string }>('/api/ai/audit-chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),

  explain: (concept: string) =>
    request<{ explanation: string }>('/api/ai/explain-concept', {
      method: 'POST',
      body: JSON.stringify({ concept }),
    }),

  // Audio audit - sends audio directly to Gemini for transcription + audit
  auditCall: (data: any) =>
    request<any>('/api/ai/audit-audio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// SOP APIs
export interface SOP {
  _id: string;
  id?: string;
  name: string; // Schema field
  title?: string; // Alias for name - used by frontend
  description?: string;
  content?: string; // Base64 encoded file content
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string; // Legacy field
  projectId?: string;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  status?: string;
  version?: string;
}

export const sopApi = {
  list: () => request<SOP[]>('/api/sops'),

  getById: (id: string) => request<SOP>(`/api/sops/${id}`),

  create: (data: FormData) =>
    request<SOP>('/api/sops', {
      method: 'POST',
      body: data, // Send FormData directly for file upload
      headers: {}, // Let browser set Content-Type for FormData
    }),

  update: (id: string, data: Partial<SOP>) =>
    request<SOP>(`/api/sops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/sops/${id}`, { method: 'DELETE' }),

  // Template methods
  getTemplates: () =>
    request<{ id: string; name: string; description: string }[]>(
      '/api/sops/templates',
    ),

  getTemplate: (templateId: string) =>
    request<{ name: string; description: string; content: string }>(
      `/api/sops/templates/${templateId}`,
    ),

  createFromTemplate: (templateId: string, name?: string) =>
    request<SOP>(`/api/sops/from-template/${templateId}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  seedDefaults: () =>
    request<{ success: boolean; message: string; data: SOP[] }>(
      '/api/sops/seed-defaults',
      {
        method: 'POST',
      },
    ),
};

// Alert APIs
export interface Alert {
  _id: string;
  type:
    | 'FATAL_FAILURE'
    | 'THRESHOLD_BREACH'
    | 'AT_RISK_AGENT'
    | 'COMPLIANCE_VIOLATION'
    | 'LOW_SCORE';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  projectId?: string;
  auditId?: string;
  agentUserId?: string;
  agentName?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: string;
  updatedAt: string;
}

export const alertApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    request<{ data: Alert[]; total: number; page: number; totalPages: number }>(
      '/api/alerts',
      {
        params: params
          ? {
              page: params.page,
              limit: params.limit,
              unreadOnly: params.unreadOnly ? 'true' : undefined,
            }
          : undefined,
      },
    ),

  getUnreadCount: () => request<{ count: number }>('/api/alerts/unread-count'),

  markAsRead: (id: string) =>
    request<void>(`/api/alerts/${id}/read`, { method: 'POST' }),

  markAllAsRead: () =>
    request<void>('/api/alerts/mark-all-read', { method: 'POST' }),

  acknowledge: (id: string) =>
    request<void>(`/api/alerts/${id}/acknowledge`, { method: 'POST' }),
};

// Notification Settings Interfaces
export interface AlertRuleConfig {
  type:
    | 'fatal_failure'
    | 'threshold_breach'
    | 'at_risk'
    | 'compliance'
    | 'low_score';
  enabled: boolean;
  channels: ('push' | 'email' | 'webhook')[];
  config: Record<string, any>;
}

export interface NotificationSettings {
  _id: string;
  projectId: string;
  alertRules: AlertRuleConfig[];
  alertRecipientEmails: string[]; // Email addresses to receive alerts
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export interface Webhook {
  _id: string;
  projectId: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  lastTriggered?: string;
  lastError?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export const notificationApi = {
  getSettings: () =>
    request<NotificationSettings>('/api/notifications/settings'),

  updateSettings: (data: Partial<NotificationSettings>) =>
    request<NotificationSettings>('/api/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getWebhooks: () => request<Webhook[]>('/api/notifications/webhooks'),

  createWebhook: (data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
  }) =>
    request<Webhook>('/api/notifications/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWebhook: (id: string, data: Partial<Webhook>) =>
    request<Webhook>(`/api/notifications/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWebhook: (id: string) =>
    request<void>(`/api/notifications/webhooks/${id}`, { method: 'DELETE' }),

  testWebhook: (id: string) =>
    request<{ success: boolean; message: string }>(
      `/api/notifications/webhooks/${id}/test`,
      { method: 'POST' },
    ),

  testEmail: (email: string) =>
    request<{ success: boolean; message: string }>(
      '/api/notifications/email/test',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    ),
};

// Ticket API
export interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  messages: any[];
  createdAt: string;
}

export const ticketApi = {
  list: (filters?: { status?: string; search?: string }) =>
    request<Ticket[]>('/api/tickets', { params: filters as any }),
  getById: (id: string) => request<Ticket>(`/api/tickets/${id}`),
  getStats: () => request<any>('/api/tickets/stats'),
  create: (data: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }) =>
    request<Ticket>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addMessage: (id: string, content: string, isInternal: boolean = false) =>
    request<Ticket>(`/api/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal }),
    }),
};

export default {
  auth: authApi,
  audit: auditApi,
  campaign: campaignApi,
  qaParameter: qaParameterApi,
  user: userApi,
  queue: queueApi,
  ai: aiApi,
  sop: sopApi,
  alert: alertApi,
  notification: notificationApi,
  ticket: ticketApi,
};
