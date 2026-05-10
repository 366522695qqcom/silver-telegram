const axios = require('axios');
const { Readable } = require('stream');

class ProviderService {
  async testConnection(config) {
    const { base_url, api_key, provider_type } = config;
    
    try {
      const headers = this.buildHeaders(provider_type, api_key);
      let testEndpoint;

      if (provider_type === 'anthropic') {
        return { success: true, message: 'Anthropic API key validated (no test endpoint)' };
      } else if (provider_type === 'google') {
        testEndpoint = this.buildGoogleUrl(base_url, api_key, 'models');
      } else {
        testEndpoint = base_url.replace(/\/$/, '') + '/models';
      }

      const response = await axios.get(testEndpoint, { headers, timeout: 10000, maxRedirects: 3 });
      return { success: true, status: response.status, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message 
      };
    }
  }

  async getModels(config) {
    const { base_url, api_key, provider_type } = config;
    
    try {
      const headers = this.buildHeaders(provider_type, api_key);
      let modelsUrl;

      if (provider_type === 'google') {
        modelsUrl = this.buildGoogleUrl(base_url, api_key, 'models');
      } else {
        modelsUrl = base_url.replace(/\/$/, '') + '/models';
      }
      
      const response = await axios.get(modelsUrl, { headers, timeout: 15000, maxRedirects: 3 });
      
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
      throw new Error(`Failed to fetch models: ${error.response?.data?.error?.message || error.message}`);
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
      } else if (provider_type === 'google') {
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

      const configOptions = { 
        headers, 
        timeout: 120000,
        maxRedirects: 3,
        responseType: stream && provider_type !== 'google' ? 'stream' : 'json',
      };

      const response = await axios.post(endpoint, payload, configOptions);

      const latency = Date.now() - startTime;

      if (stream && provider_type !== 'google') {
        return {
          success: true,
          data: response.data,
          latency_ms: latency,
          isStream: true,
        };
      }

      return {
        success: true,
        data: this.normalizeResponse(response.data, provider_type),
        latency_ms: latency,
        isStream: false,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        status_code: error.response?.status,
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

      const response = await axios.post(endpoint, payload, { headers, timeout: 60000, maxRedirects: 3 });
      const latency = Date.now() - startTime;

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
        error: error.response?.data?.error?.message || error.message,
        status_code: error.response?.status,
        latency_ms: latency,
      };
    }
  }

  buildHeaders(providerType, apiKey) {
    const headers = {
      'Content-Type': 'application/json',
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

  normalizeResponse(response, providerType) {
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

    if (providerType === 'google') {
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
