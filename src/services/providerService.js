const { Readable } = require('stream');

class ProviderService {
  isNativeGoogleApi(baseUrl) {
    return baseUrl.includes('googleapis.com');
  }

  async httpRequest(url, options = {}) {
    const { method = 'GET', headers = {}, body, timeout = 15000 } = options;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions = {
        method,
        headers,
        signal: controller.signal,
        redirect: 'follow',
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        try {
          data = JSON.parse(data);
        } catch (e) {
          // not JSON, keep as text
        }
      }

      return { status: response.status, ok: response.ok, data, headers: response.headers };
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(config) {
    const { base_url, api_key, provider_type } = config;
    
    try {
      const headers = this.buildHeaders(provider_type, api_key);
      let testEndpoint;

      if (provider_type === 'anthropic') {
        return { success: true, message: 'Anthropic API key validated (no test endpoint)' };
      } else if (provider_type === 'google' && this.isNativeGoogleApi(base_url)) {
        testEndpoint = this.buildGoogleUrl(base_url, api_key, 'models');
      } else {
        testEndpoint = base_url.replace(/\/$/, '') + '/models';
      }

      const response = await this.httpRequest(testEndpoint, { headers, timeout: 10000 });
      
      if (response.ok) {
        return { success: true, status: response.status, message: 'Connection successful' };
      }
      
      return { 
        success: false, 
        status: response.status,
        message: response.data?.error?.message || `HTTP ${response.status}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.name === 'AbortError' ? 'Connection timed out' : (error.message || 'Unknown error')
      };
    }
  }

  async getModels(config) {
    const { base_url, api_key, provider_type } = config;
    
    try {
      const headers = this.buildHeaders(provider_type, api_key);
      let modelsUrl;

      if (provider_type === 'google' && this.isNativeGoogleApi(base_url)) {
        modelsUrl = this.buildGoogleUrl(base_url, api_key, 'models');
      } else {
        modelsUrl = base_url.replace(/\/$/, '') + '/models';
      }
      
      const response = await this.httpRequest(modelsUrl, { headers, timeout: 15000 });

      if (!response.ok) {
        throw new Error(response.data?.error?.message || `HTTP ${response.status}`);
      }
      
      if (response.data?.data) {
        return response.data.data.map(model => ({
          id: model.id,
          name: model.id,
          owned_by: model.owned_by || 'unknown',
        }));
      }
      
      if (Array.isArray(response.data)) {
        return response.data.map(model => ({
          id: model.id || model.name,
          name: model.id || model.name,
          owned_by: model.owned_by || 'unknown',
        }));
      }

      if (response.data?.models && Array.isArray(response.data.models)) {
        return response.data.models.map(model => ({
          id: model.name || model.id,
          name: model.displayName || model.name || model.id,
          owned_by: model.owned_by || 'google',
        }));
      }

      return [];
    } catch (error) {
      if (error.message && error.message.includes('redirect')) {
        throw new Error('获取模型列表失败：请求发生重定向循环，请检查 Base URL 是否正确');
      }
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  async chatCompletion(config, requestData) {
    const { base_url, api_key, provider_type } = config;
    const { model, messages, max_tokens, temperature, stream } = requestData;
    const startTime = Date.now();

    try {
      const headers = this.buildHeaders(provider_type, api_key);
      let endpoint;
      let payload;

      if (provider_type === 'anthropic') {
        endpoint = base_url.replace(/\/$/, '') + '/messages';
        payload = {
          model,
          messages,
          max_tokens: max_tokens || 1024,
          temperature,
        };
        if (requestData.system) {
          payload.system = requestData.system;
        }
      } else if (provider_type === 'google' && this.isNativeGoogleApi(base_url)) {
        endpoint = this.buildGoogleUrl(base_url.replace(/\/$/, ''), api_key, `models/${model}:generateContent`);
        payload = {
          contents: this.convertToGoogleMessages(messages),
          generationConfig: {
            maxOutputTokens: max_tokens,
            temperature,
          },
        };
      } else {
        endpoint = base_url.replace(/\/$/, '') + '/chat/completions';
        payload = { model, messages, max_tokens, temperature, stream };
      }

      if (stream && provider_type !== 'google') {
        const axios = require('axios');
        const response = await axios.post(endpoint, payload, { 
          headers, 
          timeout: 120000, 
          maxRedirects: 5,
          responseType: 'stream',
        });
        const latency = Date.now() - startTime;
        return { success: true, data: response.data, latency_ms: latency, isStream: true };
      }

      const response = await this.httpRequest(endpoint, { 
        method: 'POST', 
        headers, 
        body: payload, 
        timeout: 120000 
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          error: response.data?.error?.message || `HTTP ${response.status}`,
          status_code: response.status,
          latency_ms: latency,
          isStream: false,
        };
      }

      return {
        success: true,
        data: this.normalizeResponse(response.data, provider_type, base_url),
        latency_ms: latency,
        isStream: false,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        status_code: undefined,
        latency_ms: latency,
        isStream: false,
      };
    }
  }

  async embeddings(config, requestData) {
    const { base_url, api_key, provider_type } = config;
    const startTime = Date.now();

    try {
      const headers = this.buildHeaders(provider_type, api_key);
      const endpoint = base_url.replace(/\/$/, '') + '/embeddings';

      const payload = {
        model: requestData.model,
        input: requestData.input,
        encoding_format: requestData.encoding_format || 'float',
      };

      const response = await this.httpRequest(endpoint, { 
        method: 'POST', 
        headers, 
        body: payload, 
        timeout: 60000 
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          error: response.data?.error?.message || `HTTP ${response.status}`,
          status_code: response.status,
          latency_ms: latency,
        };
      }

      return {
        success: true,
        data: {
          object: 'list',
          data: response.data.data,
          model: response.data.model,
          usage: response.data.usage,
        },
        latency_ms: latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        status_code: undefined,
        latency_ms: latency,
      };
    }
  }

  buildHeaders(providerType, apiKey) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (providerType === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
  }

  buildGoogleUrl(baseUrl, apiKey, path) {
    const base = baseUrl.replace(/\/$/, '');
    const separator = base.includes('?') ? '&' : '?';
    return `${base}/${path}${separator}key=${apiKey}`;
  }

  convertToGoogleMessages(messages) {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));
  }

  normalizeResponse(response, providerType, baseUrl) {
    if (providerType === 'anthropic') {
      return {
        id: response.id,
        model: response.model,
        provider: 'anthropic',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.content?.[0]?.text || '',
          },
          finish_reason: response.stop_reason || 'stop',
        }],
        usage: {
          prompt_tokens: response.usage?.input_tokens || 0,
          completion_tokens: response.usage?.output_tokens || 0,
          total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
      };
    }

    if (providerType === 'google' && this.isNativeGoogleApi(baseUrl || '')) {
      const candidate = response.candidates?.[0];
      return {
        id: response.id || `google-${Date.now()}`,
        model: response.modelVersion || '',
        provider: 'google',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: candidate?.content?.parts?.[0]?.text || '',
          },
          finish_reason: candidate?.finishReason || 'stop',
        }],
        usage: {
          prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    }

    return {
      id: response.id,
      model: response.model,
      provider: 'openai-compatible',
      choices: response.choices,
      usage: response.usage,
    };
  }
}

module.exports = new ProviderService();
