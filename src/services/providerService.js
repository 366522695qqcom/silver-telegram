const axios = require('axios');
const { Readable } = require('stream');

class ProviderService {
  async testConnection(config) {
    const { base_url, api_key, provider_type } = config;
    
    try {
      let testEndpoint = base_url;
      const headers = this.buildHeaders(provider_type, api_key);

      if (base_url.includes('/v1') || provider_type === 'openai') {
        testEndpoint = base_url.replace(/\/$/, '') + '/models';
      } else if (provider_type === 'anthropic') {
        return { success: true, message: 'Anthropic API key validated (no test endpoint)' };
      }

      const response = await axios.get(testEndpoint, { headers, timeout: 10000, maxRedirects: 5 });
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
      const modelsUrl = base_url.replace(/\/$/, '') + '/models';
      
      const response = await axios.get(modelsUrl, { headers, timeout: 15000, maxRedirects: 5 });
      
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

      return [];
    } catch (error) {
      console.warn(`Failed to fetch models:`, error.message);
      return [];
    }
  }

  async chatCompletion(config, requestData) {
    const { base_url, api_key, provider_type } = config;
    const { model, messages, max_tokens, temperature, stream } = requestData;
    const startTime = Date.now();

    try {
      const headers = this.buildHeaders(provider_type, api_key);
      let endpoint = base_url.replace(/\/$/, '');
      let payload = { model, messages, max_tokens, temperature };

      if (provider_type === 'anthropic') {
        endpoint += '/messages';
        payload = {
          model,
          messages,
          max_tokens: max_tokens || 1024,
          temperature,
        };
        if (requestData.system) {
          payload.system = requestData.system;
        }
      } else {
        endpoint += '/chat/completions';
        payload.stream = stream;
      }

      const configOptions = { 
        headers, 
        timeout: 120000,
        responseType: stream ? 'stream' : 'json',
      };

      const response = await axios.post(endpoint, payload, configOptions);

      const latency = Date.now() - startTime;

      if (stream) {
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

      const response = await axios.post(endpoint, payload, { headers, timeout: 60000 });
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
    } else if (providerType === 'google') {
      return headers;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
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