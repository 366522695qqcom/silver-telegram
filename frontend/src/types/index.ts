export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  user_id?: string;
  provider_name: string;
  provider_type: string;
  api_key?: string;
  base_url: string;
  enabled: number;
  avg_latency?: number;
  last_success_at?: string | null;
  last_failed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key: string;
  name: string;
  enabled: number;
  created_at: string;
  expires_at: string | null;
}

export interface Request {
  id: string;
  api_key_id: string;
  provider: string;
  model: string;
  status_code: number;
  latency: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost: number;
  error_message: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  owned_by: string;
}

export interface ModelListResponse {
  provider_id: string;
  provider_name: string;
  models: Model[];
  error?: string;
}

export interface Stats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatency: number;
  activeConnections: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface CreateProviderData {
  provider_name: string;
  provider_type: string;
  api_key: string;
  base_url: string;
}

export interface CreateApiKeyData {
  name: string;
  expires_at?: string;
}

export interface TestConnectionResult {
  success: boolean;
  status?: number;
  message: string;
  latency_ms?: number;
}

export interface CustomModel {
  id: string;
  user_id: string;
  provider_id: string | null;
  provider_name?: string;
  model_name: string;
  model_id: string;
  model_type: string;
  capabilities: string;
  context_window: number | null;
  max_output_tokens: number | null;
  base_url: string | null;
  api_key: string | null;
  enabled: number;
  created_at: string;
}

export interface CreateCustomModelData {
  provider_id?: string;
  model_name: string;
  model_id: string;
  model_type?: string;
  capabilities?: string;
  context_window?: number | null;
  max_output_tokens?: number | null;
  base_url?: string;
  api_key?: string;
}
