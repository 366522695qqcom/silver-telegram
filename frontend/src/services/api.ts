import Cookies from 'js-cookie';
import type { User, Provider, ApiKey, Request, AuditLog, ModelListResponse, LoginData, RegisterData, CreateProviderData, CreateApiKeyData, TestConnectionResult, CustomModel, CreateCustomModelData } from '@/types';

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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

export const routingAPI = {
  getRules: async (): Promise<any[]> => {
    const result: any = await request('/routing/rules');
    return result.rules || [];
  },

  getRuleById: async (id: string): Promise<any> => {
    const result: any = await request(`/routing/rules/${id}`);
    return result.rule;
  },

  createRule: async (data: any): Promise<any> => {
    const result: any = await request('/routing/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.rule;
  },

  updateRule: async (id: string, data: any): Promise<any> => {
    const result: any = await request(`/routing/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.rule;
  },

  deleteRule: async (id: string): Promise<void> => {
    return request(`/routing/rules/${id}`, {
      method: 'DELETE',
    });
  },

  runHealthCheck: async (): Promise<any[]> => {
    const result: any = await request('/routing/healthcheck', {
      method: 'POST',
    });
    return result.results || [];
  },
};

export const batchAPI = {
  getTasks: async (): Promise<any[]> => {
    const result: any = await request('/batch/tasks');
    return result.tasks || [];
  },

  getTaskById: async (id: string): Promise<any> => {
    const result: any = await request(`/batch/tasks/${id}`);
    return result.task;
  },

  createTask: async (data: any): Promise<any> => {
    const result: any = await request('/batch/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.task;
  },

  executeTask: async (id: string, providerId: string): Promise<any> => {
    const result: any = await request(`/batch/tasks/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ provider_id: providerId }),
    });
    return result.task;
  },

  deleteTask: async (id: string): Promise<void> => {
    return request(`/batch/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

export const toolsAPI = {
  getAll: async (): Promise<any[]> => {
    const result: any = await request('/tools');
    return result.tools || [];
  },

  getById: async (id: string): Promise<any> => {
    const result: any = await request(`/tools/${id}`);
    return result.tool;
  },

  create: async (data: any): Promise<any> => {
    const result: any = await request('/tools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.tool;
  },

  update: async (id: string, data: any): Promise<any> => {
    const result: any = await request(`/tools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.tool;
  },

  delete: async (id: string): Promise<void> => {
    return request(`/tools/${id}`, {
      method: 'DELETE',
    });
  },

  execute: async (id: string, parameters: any): Promise<any> => {
    return request(`/tools/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
  },
};

export const visionAPI = {
  analyzeImage: async (imageUrl: string, prompt: string, providerId: string): Promise<any> => {
    return request('/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl, prompt, provider_id: providerId }),
    });
  },

  visionChat: async (messages: any[], providerId: string, options?: any): Promise<any> => {
    return request('/vision/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, provider_id: providerId, options }),
    });
  },
};

export const imagesAPI = {
  generate: async (prompt: string, providerId: string, options?: any): Promise<any> => {
    return request('/images/generations', {
      method: 'POST',
      body: JSON.stringify({ prompt, provider_id: providerId, options }),
    });
  },
};

export const asyncAPI = {
  getTasks: async (): Promise<any[]> => {
    const result: any = await request('/async/tasks');
    return result.tasks || [];
  },

  getTaskById: async (id: string): Promise<any> => {
    const result: any = await request(`/async/tasks/${id}`);
    return result.task;
  },

  createTask: async (data: any): Promise<any> => {
    const result: any = await request('/async/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.task;
  },

  deleteTask: async (id: string): Promise<void> => {
    return request(`/async/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

export const webhookAPI = {
  test: async (webhookUrl: string, webhookSecret?: string): Promise<any> => {
    return request('/webhooks/test', {
      method: 'POST',
      body: JSON.stringify({ webhook_url: webhookUrl, webhook_secret: webhookSecret }),
    });
  },
};

export const customModelsAPI = {
  getAll: async (): Promise<CustomModel[]> => {
    return request('/custom-models');
  },
  create: async (data: CreateCustomModelData): Promise<CustomModel> => {
    return request('/custom-models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
  testConnection: async (id: string): Promise<{ success: boolean; status?: number; message: string; availableModels?: string[] }> => {
    return request(`/custom-models/${id}/test`, { method: 'POST' });
  },
};
