import Cookies from 'js-cookie';
import type { User, Provider, ApiKey, Request, AuditLog, ModelListResponse, LoginData, CreateProviderData, CreateApiKeyData, TestConnectionResult, CustomModel, CreateCustomModelData } from '@/types';

const request = async <T>(url: string, options: RequestInit = {}, timeout: number = 8000): Promise<T> => {
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`/api${url}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = 'Request failed';
      try {
        const error = JSON.parse(text);
        errorMessage = error.error || errorMessage;
      } catch (e) {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
};

export const authAPI = {
  login: async (data: LoginData): Promise<{ user: User; token: string }> => {
    return request('/auth/login', {
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

  getModels: async (providerId?: string, filter?: string): Promise<ModelListResponse> => {
    let url = providerId ? `/providers/${providerId}/models` : '/providers/models';
    if (filter) {
      url += `?filter=${encodeURIComponent(filter)}`;
    }
    return request(url, {}, 30000);
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
    avg_latency_ms: number;
    today_requests: number;
    provider_stats: { provider: string; count: number; avg_latency_ms: number; total_cost: number }[];
    top_providers: { provider: string; count: number }[];
    top_models: { model: string; count: number }[];
  }> => {
    return request('/monitor/stats');
  },

  getDaily: async (): Promise<{ date: string; label: string; count: number; success_count: number }[]> => {
    return request('/monitor/daily');
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

  sendTestRequest: async (): Promise<{ success: boolean; message: string; request: Record<string, unknown> }> => {
    return request('/test-request', { method: 'POST' });
  },
};

export const auditAPI = {
  getLogs: async (page?: number, limit?: number): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/audit${queryString}`);
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

export const customModelsAPI = {
  getAll: async (providerId?: string): Promise<CustomModel[]> => {
    const params = new URLSearchParams();
    if (providerId) params.set('provider_id', providerId);
    const qs = params.toString();
    return request(`/custom-models${qs ? `?${qs}` : ''}`);
  },
  create: async (data: CreateCustomModelData): Promise<CustomModel> => {
    return request('/custom-models', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 30000);
  },
  update: async (id: string, data: Partial<CreateCustomModelData & { enabled: boolean }>): Promise<CustomModel> => {
    return request(`/custom-models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    return request(`/custom-models/${id}`, { method: 'DELETE' });
  },
  deleteAll: async (ids: string[]): Promise<void> => {
    return request('/custom-models', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },
  toggleStatus: async (id: string): Promise<CustomModel> => {
    return request(`/custom-models/${id}/toggle`, { method: 'POST' });
  },
  testConnection: async (id: string): Promise<TestConnectionResult> => {
    return request(`/custom-models/${id}/test`, { method: 'POST' });
  },
  batchCreate: async (models: CreateCustomModelData[]): Promise<CustomModel[]> => {
    return request('/custom-models/batch', {
      method: 'POST',
      body: JSON.stringify({ models }),
    }, 30000);
  },
};
