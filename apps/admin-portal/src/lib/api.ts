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
  createdAt: string;
}

export const instanceApi = {
  findAll: () => request<Instance[]>('/api/admin/instances'),
  create: (data: any) => request<Instance>('/api/admin/instances', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<Instance>(`/api/admin/instances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLogs: (id: string) => request<any[]>(`/api/admin/instances/${id}/logs`),
  getDomains: (id: string) => request<any>(`/api/admin/instances/${id}/domains`),
  regenerateApiKey: (id: string) => request<{ apiKey: string }>(`/api/admin/instances/${id}/regenerate-api-key`, { method: 'POST' }),
  updateBillingType: (id: string, billingType: 'prepaid' | 'postpaid') =>
    request<Instance>(`/api/admin/instances/${id}/billing-type`, { method: 'PUT', body: JSON.stringify({ billingType }) }),
  updateLimits: (id: string, limits: { maxUsers?: number; maxStorage?: string }) =>
    request<Instance>(`/api/admin/instances/${id}/limits`, { method: 'PUT', body: JSON.stringify(limits) }),
  updateCredits: (id: string, credits: { totalAudits?: number; totalTokens?: number; usedAudits?: number; usedTokens?: number }) =>
    request<Instance>(`/api/admin/instances/${id}/credits`, { method: 'PUT', body: JSON.stringify(credits) }),

  // Simulated methods for actions not yet supported by backend
  start: async (id: string) => { await new Promise(r => setTimeout(r, 1000)); return true; },
  stop: async (id: string) => { await new Promise(r => setTimeout(r, 1000)); return true; },
  restart: async (id: string) => { await new Promise(r => setTimeout(r, 1000)); return true; },
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
  delete: (id: string) => request<void>(`/api/users/${id}`, { method: 'DELETE' }),
};

export const adminApi = {
  getPlatformStats: () => request<any>('/api/admin/stats'), // Placeholder endpoint
}

export const backupApi = {
  getByInstance: (instanceId: string) => request<any[]>(`/api/admin/backups/instance/${instanceId}`),
  restore: (id: string) => request<void>(`/api/admin/backups/${id}/restore`, { method: 'POST' }),
  delete: (id: string) => request<void>(`/api/admin/backups/${id}`, { method: 'DELETE' }),
};

export const creditsApi = {
  addAuditCredits: (instanceId: string, data: { amount: number; reason: string }) =>
    request<void>(`/api/admin/credits/${instanceId}/audit`, { method: 'POST', body: JSON.stringify(data) }),
  addTokenCredits: (instanceId: string, data: { amount: number; reason: string }) =>
    request<void>(`/api/admin/credits/${instanceId}/token`, { method: 'POST', body: JSON.stringify(data) }),
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

export default {
  auth: authApi,
  audit: auditApi,
  alerts: alertsApi,
  admin: adminApi,
  instance: instanceApi,
  user: userApi,
  backup: backupApi,
  credits: creditsApi,
  ticket: ticketApi,
};

