/**
 * API Service Layer
 * Centralized API calls with error handling
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
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

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
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
  logout: () =>
    request('/api/users/logout', { method: 'POST' }),
  me: () =>
    request<{ username: string; fullName?: string; email?: string; role: string }>('/api/users/me'),
};

export interface AuditStats {
  total: number;
  aiAudits: number;
  manualAudits: number;
  avgScore: number;
  passRate: number;
  totalTokens: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Instance APIs
export interface Instance {
  _id: string;
  name?: string;
  clientId?: string;
  companyName?: string;
  plan?: string;
  status: 'running' | 'stopped' | 'provisioning' | 'error' | 'active' | 'suspended';
  region?: string;
  version?: string;
  cpu?: number;
  memory?: number;
  lastHealthCheck?: string;
  publicIp?: string;
  domain?: {
    subdomain: string;
    customDomain?: string;
  };
  apiKey?: string;
  credits?: {
    billingType: 'prepaid' | 'postpaid';
    totalAudits: number;
    usedAudits: number;
    totalTokens: number;
    usedTokens: number;
    totalApiCalls: number;
  };
  limits?: {
    maxUsers: number;
    maxStorage: string;
  };
  usage?: {
    cpu: number;
    memory: number;
    storage: string;
    activeUsers: number;
    lastReportedAt: string;
  };
  createdAt: string;
}

export const instanceApi = {
  findAll: () => request<Instance[]>('/api/admin/instances'),
  findById: (id: string) => request<Instance>(`/api/admin/instances/${id}`),
  create: (data: any) => request<Instance>('/api/admin/instances', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<Instance>(`/api/admin/instances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/admin/instances/${id}`, { method: 'DELETE' }),
  getLogs: (id: string) => request<any[]>(`/api/admin/instances/${id}/logs`),
  getDomains: (id: string) => request<any>(`/api/admin/instances/${id}/domains`),
  regenerateApiKey: (id: string) => request<{ apiKey: string }>(`/api/admin/instances/${id}/regenerate-api-key`, { method: 'POST' }),
  updateBillingType: (id: string, billingType: 'prepaid' | 'postpaid') =>
    request<Instance>(`/api/admin/instances/${id}/billing-type`, { method: 'PUT', body: JSON.stringify({ billingType }) }),
  updateLimits: (id: string, limits: { maxUsers?: number; maxStorage?: string }) =>
    request<Instance>(`/api/admin/instances/${id}/limits`, { method: 'PUT', body: JSON.stringify(limits) }),
  updateCredits: (id: string, credits: { totalAudits?: number; totalTokens?: number; usedAudits?: number; usedTokens?: number }) =>
    request<Instance>(`/api/admin/instances/${id}/credits`, { method: 'PUT', body: JSON.stringify(credits) }),

  // Domain management
  addCustomDomain: (id: string, domain: string) =>
    request<Instance>(`/api/admin/instances/${id}/domains/custom`, { method: 'POST', body: JSON.stringify({ domain }) }),
  verifyDomain: (id: string) =>
    request<{ verified: boolean; error?: string }>(`/api/admin/instances/${id}/domains/verify`, { method: 'POST' }),
  removeDomain: (id: string) =>
    request<Instance>(`/api/admin/instances/${id}/domains/custom`, { method: 'DELETE' }),
  updateSubdomain: (id: string, subdomain: string) =>
    request<Instance>(`/api/admin/instances/${id}/domains/subdomain`, { method: 'PUT', body: JSON.stringify({ subdomain }) }),

  // Instance actions (will trigger via provisioning/SSH)
  start: (id: string) => request<{ success: boolean }>(`/api/admin/instances/${id}/start`, { method: 'POST' }),
  stop: (id: string) => request<{ success: boolean }>(`/api/admin/instances/${id}/stop`, { method: 'POST' }),
  restart: (id: string) => request<{ success: boolean }>(`/api/admin/instances/${id}/restart`, { method: 'POST' }),
};

export const auditApi = {
  getStats: (filters?: Record<string, string | number | undefined>) =>
    request<AuditStats>('/api/audits/stats', { params: filters }),
  list: (filters: { page?: number; limit?: number }) =>
    request<{ pagination: { total: number } }>('/api/audits', { params: filters as any }),
};

export const alertsApi = {
  list: (params?: any) => request<any[]>('/api/alerts', { params }),
  getUnreadCount: () => request<{ count: number }>('/api/alerts/unread-count'),
  markRead: (id: string) => request(`/api/alerts/${id}/read`, { method: 'POST' }),
  markAllRead: () => request('/api/alerts/mark-all-read', { method: 'POST' }),
};

export const userApi = {
  list: (filters: { page?: number; limit?: number; role?: string }) =>
    request<{ data: User[], pagination: { total: number } }>('/api/users', { params: filters as any }),
  create: (data: any) => request<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/users/${id}`, { method: 'DELETE' }),
};

export const adminApi = {
  getPlatformStats: () => request<any>('/api/admin/stats'), // Placeholder endpoint
}

export const backupApi = {
  getByInstance: (instanceId: string) => request<any[]>(`/api/admin/backups/instance/${instanceId}`),
  create: (instanceId: string) => request<any>(`/api/admin/backups/instance/${instanceId}`, { method: 'POST' }),
  restore: (id: string) => request<{ success: boolean; error?: string }>(`/api/admin/backups/${id}/restore`, { method: 'POST' }),
  delete: (id: string) => request<void>(`/api/admin/backups/${id}`, { method: 'DELETE' }),
  getStats: (instanceId?: string) =>
    request<any>(instanceId ? `/api/admin/backups/stats/${instanceId}` : '/api/admin/backups/stats'),
  getById: (id: string) => request<any>(`/api/admin/backups/${id}`),
};

export const creditsApi = {
  addAuditCredits: (instanceId: string, data: { amount: number; reason: string }) =>
    request<void>(`/api/admin/credits/${instanceId}/audit`, { method: 'POST', body: JSON.stringify(data) }),
  addTokenCredits: (instanceId: string, data: { amount: number; reason: string }) =>
    request<void>(`/api/admin/credits/${instanceId}/token`, { method: 'POST', body: JSON.stringify(data) }),
};

// Template interfaces and API
export interface Template {
  _id: string;
  name: string;
  type: 'sop' | 'parameters';
  industry: string;
  description?: string;
  content?: any;
  isDefault?: boolean;
  createdAt: string;
}

export const templateApi = {
  list: (filters?: { type?: string; industry?: string }) =>
    request<Template[]>('/api/admin/templates', { params: filters as any }),
  getById: (id: string) => request<Template>(`/api/admin/templates/${id}`),
  create: (data: Partial<Template>) =>
    request<Template>('/api/admin/templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Template>) =>
    request<Template>(`/api/admin/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/admin/templates/${id}`, { method: 'DELETE' }),
  getIndustries: () => request<string[]>('/api/admin/templates/industries'),
  clone: (id: string) => request<Template>(`/api/admin/templates/${id}/clone`, { method: 'POST' }),
};

// Announcement interfaces and API
export interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'update';
  audience: 'all' | 'admins' | 'specific';
  isActive: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdAt: string;
  createdBy?: string;
}

export const announcementApi = {
  list: (all?: boolean) =>
    request<Announcement[]>('/api/announcements', { params: { all: all ? 'true' : undefined } }),
  getById: (id: string) => request<Announcement>(`/api/announcements/${id}`),
  create: (data: Partial<Announcement>) =>
    request<Announcement>('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Announcement>) =>
    request<Announcement>(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/announcements/${id}`, { method: 'DELETE' }),
  deactivate: (id: string) =>
    request<Announcement>(`/api/announcements/${id}/deactivate`, { method: 'PUT' }),
};

// Ticket interface and API
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
  projectId?: string;
  messages: any[];
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export const ticketApi = {
  list: (filters?: { status?: string; priority?: string; search?: string }) =>
    request<Ticket[]>('/api/tickets', { params: filters as any }),
  getById: (id: string) =>
    request<Ticket>(`/api/tickets/${id}`),
  getStats: () =>
    request<any>('/api/tickets/stats'),
  update: (id: string, data: any) =>
    request<Ticket>(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assign: (id: string, assignedTo: string, assignedToName: string) =>
    request<Ticket>(`/api/tickets/${id}/assign`, { method: 'PUT', body: JSON.stringify({ assignedTo, assignedToName }) }),
  updateStatus: (id: string, status: string) =>
    request<Ticket>(`/api/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  addMessage: (id: string, content: string, isInternal: boolean = false) =>
    request<Ticket>(`/api/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ content, isInternal }) }),
};

export const settingsApi = {
  get: () => request<any>('/api/admin/settings'),
  update: (data: any) => request<any>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

export const healthApi = {
  check: () => request<{ status: string; info: any; error: any; details: any }>('/api/health'),
};

export default {
  auth: authApi,
  audit: auditApi,
  alerts: alertsApi,
  admin: adminApi,
  instance: {
    ...instanceApi,
    updateUsage: (id: string, usage: { cpu: number; memory: number; storage: string; activeUsers: number }) =>
      request<Instance>(`/api/admin/instances/${id}/usage`, { method: 'POST', body: JSON.stringify(usage) }),
  },
  user: userApi,
  backup: backupApi,
  credits: creditsApi,
  ticket: ticketApi,
  template: templateApi,
  announcement: announcementApi,
  settings: settingsApi,
  health: healthApi,
};

