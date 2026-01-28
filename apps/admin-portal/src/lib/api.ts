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
  status: 'running' | 'stopped' | 'provisioning' | 'error';
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
  createdAt: string;
}

export const instanceApi = {
  findAll: () => request<Instance[]>('/api/admin/instances'),
  create: (data: any) => request<Instance>('/api/admin/instances', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<Instance>(`/api/admin/instances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLogs: (id: string) => request<any[]>(`/api/admin/instances/${id}/logs`),
  getDomains: (id: string) => request<any>(`/api/admin/instances/${id}/domains`),

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

export default {
  auth: authApi,
  audit: auditApi,
  alerts: alertsApi,
  admin: adminApi,
  instance: instanceApi,
  user: userApi,
  backup: backupApi,
  credits: creditsApi,
};
