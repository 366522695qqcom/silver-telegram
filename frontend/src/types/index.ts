export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Provider {
  id: string;
  user_id: string;
  provider_name: string;
  provider_type: 'openai' | 'anthropic' | 'custom';
  api_key: string;
  base_url: string;
  enabled: boolean;
  last_success_at?: string;
  last_failed_at?: string;
  avg_latency?: number;
  created_at: string;
}

export interface ApiKey {
  id: string;
  key_value: string;
  name: string;
  enabled: boolean;
  rate_limit: number;
  allowed_models?: string[];
  allowed_providers?: string[];
  ip_whitelist?: string[];
  created_at: string;
}

export interface Request {
  id: string;
  provider: string;
  model: string;
  status_code: number;
  latency: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  cost?: number;
  error_message?: string;
  created_at: string;
}

export interface DashboardStats {
  total_requests: number;
  today_requests: number;
  avg_latency_ms: number;
  success_rate: number;
  provider_stats: Array<{
    provider: string;
    count: number;
    avg_latency_ms: number;
  }>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  owned_by: string;
}
