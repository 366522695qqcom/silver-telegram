import { useAppStore } from '../store';
import {
  User,
  Provider,
  ApiKey,
  DashboardStats,
  Request,
  AuditLog,
  Model,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private getHeaders() {
    const token = useAppStore.getState().token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async request(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    const url = `${API_BASE}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };
    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    if (!response.ok) {
      throw new Error(
        typeof result === 'string' ? result : result?.error || `HTTP ${response.status}`
      );
    }

    return result;
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.request('POST', '/api/auth/login', { email, password });
  }

  async register(email: string, password: string, name?: string): Promise<void> {
    return this.request('POST', '/api/auth/register', { email, password, name });
  }

  // Providers
  async getProviders(): Promise<Provider[]> {
    return this.request('GET', '/api/providers');
  }

  async createProvider(provider: Omit<Provider, 'id' | 'user_id' | 'created_at'>): Promise<Provider> {
    return this.request('POST', '/api/providers', provider);
  }

  async updateProvider(id: string, provider: Partial<Provider>): Promise<Provider> {
    return this.request('PUT', `/api/providers/${id}`, provider);
  }

  async deleteProvider(id: string): Promise<void> {
    return this.request('DELETE', `/api/providers/${id}`);
  }

  async testProvider(id: string): Promise<{ success: boolean; message: string }> {
    return this.request('POST', `/api/providers/${id}/test`);
  }

  async getProviderModels(id: string): Promise<Model[]> {
    return this.request('GET', `/api/providers/${id}/models`);
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    return this.request('GET', '/api/keys');
  }

  async createApiKey(key: Omit<ApiKey, 'id' | 'created_at'>): Promise<ApiKey> {
    return this.request('POST', '/api/keys', key);
  }

  async updateApiKey(id: string, key: Partial<ApiKey>): Promise<ApiKey> {
    return this.request('PUT', `/api/keys/${id}`, key);
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request('DELETE', `/api/keys/${id}`);
  }

  // Monitor
  async getStats(): Promise<DashboardStats> {
    return this.request('GET', '/api/monitor/stats');
  }

  async getRequests(limit = 50, offset = 0): Promise<Request[]> {
    return this.request('GET', `/api/monitor/history?limit=${limit}&offset=${offset}`);
  }

  // Audit
  async getAuditLogs(limit = 50, offset = 0): Promise<AuditLog[]> {
    return this.request('GET', `/api/audit?limit=${limit}&offset=${offset}`);
  }
}

export const apiClient = new ApiClient();
