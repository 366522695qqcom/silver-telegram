import Cookies from 'js-cookie';
import type { User, Provider, ApiKey, Request, AuditLog, ModelListResponse, LoginData, RegisterData, CreateProviderData, CreateApiKeyData, TestConnectionResult } from '@/types';

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`/api${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('登录已过期，请重新登录');
  }

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = '请求失败';
    try {
      const error = JSON.parse(text);
      errorMessage = error.error || errorMessage;
    } catch (e) {
      if (text.length > 200) {
        errorMessage = `服务器错误 (${response.status})`;
      } else {
        errorMessage = text || errorMessage;
      }
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text);
};

export const authAPI = {
  login: async (data: LoginData): Promise<{ user: User; token: string }> => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  me: async (): Promise<User> => {
    return request('/auth/me');
  },

  logout: async (): Promise<void> => {
    Cookies.remove('token');
    localStorage.removeItem('user');
  },
};

export const providersAPI = {
  getAll: async (): Promise<Provider[]> => {
    return request('/providers');
  },

  getById: async (id: string): Promise<Provider> => {
    return request(`/providers/${id}`);
  },

  create: async (data: CreateProviderData): Promise<Provider> => {
    return request('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateProviderData>): Promise<Provider> => {
    return request(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return request(`/providers/${id}`, {
      method: 'DELETE',
    });
  },

  toggleStatus: async (id: string): Promise<Provider> => {
    return request(`/providers/${id}/toggle`, {
      method: 'POST',
    });
  },

  testConnection: async (id: string): Promise<TestConnectionResult> => {
    return request(`/providers/${id}/test`, {
      method: 'POST',
    });
  },

  getModels: async (providerId?: string): Promise<ModelListResponse> => {
    const url = providerId ? `/providers/${providerId}/models` : '/providers/models';
    return request(url);
  },
};

export const apiKeysAPI = {
  getAll: async (): Promise<ApiKey[]> => {
    return request('/api-keys');
  },

  getById: async (id: string): Promise<ApiKey> => {
    return request(`/api-keys/${id}`);
  },

  create: async (data: CreateApiKeyData): Promise<ApiKey> => {
    return request('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateApiKeyData>): Promise<ApiKey> => {
    return request(`/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return request(`/api-keys/${id}`, {
      method: 'DELETE',
    });
  },

  toggleStatus: async (id: string): Promise<ApiKey> => {
    return request(`/api-keys/${id}/toggle`, {
      method: 'POST',
    });
  },

  regenerate: async (id: string): Promise<ApiKey> => {
    return request(`/api-keys/${id}/regenerate`, {
      method: 'POST',
    });
  },
};

export const monitorAPI = {
  getRequests: async (page?: number, limit?: number): Promise<Request[]> => {
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    return request(`/monitor/requests?${params.toString()}`);
  },

  getStats: async (): Promise<{
    total_requests: number;
    success_rate: number;
    avg_latency: number;
    top_providers: { provider: string; count: number }[];
    top_models: { model: string; count: number }[];
  }> => {
    return request('/monitor/stats');
  },

  getRealtimeStats: async (): Promise<{
    totalRequests: number;
    successCount: number;
    errorCount: number;
    avgLatency: number;
    activeConnections: number;
  }> => {
    return request('/monitor/realtime');
  },
};

export const auditAPI = {
  getLogs: async (page?: number, limit?: number): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    return request(`/audit/logs?${params.toString()}`);
  },
};

export const costAPI = {
  getMonthlyUsage: async (month?: number, year?: number): Promise<{
    month: number;
    year: number;
    total_cost: number;
    total_requests: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
  }> => {
    const params = new URLSearchParams();
    if (month) params.set('month', month.toString());
    if (year) params.set('year', year.toString());
    return request(`/cost/monthly?${params.toString()}`);
  },

  getHistory: async (page?: number, limit?: number): Promise<Request[]> => {
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    return request(`/cost/history?${params.toString()}`);
  },

  getQuota: async (): Promise<{
    quota: {
      daily_requests: number;
      monthly_cost_limit: number;
      total_tokens_limit: number;
    };
    usage: {
      today_requests: number;
      monthly_cost: number;
      total_tokens: number;
    };
  }> => {
    return request('/cost/quota');
  },

  updateQuota: async (data: {
    daily_requests?: number;
    monthly_cost_limit?: number;
    total_tokens_limit?: number;
  }): Promise<{
    daily_requests: number;
    monthly_cost_limit: number;
    total_tokens_limit: number;
  }> => {
    return request('/cost/quota', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
