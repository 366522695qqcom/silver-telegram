const axios = require('axios');
const BaseAdapter = require('./baseAdapter');

class AnthropicAdapter extends BaseAdapter {
  constructor() {
    super();
    this.providerName = 'anthropic';
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.models = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-2.1'];
  }

  async call(requestData, providerConfig) {
    const url = `${providerConfig.base_url || this.baseUrl}/messages`;
    const headers = {
      'x-api-key': providerConfig.api_key,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };

    const data = {
      model: requestData.model,
      messages: requestData.messages,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature,
    };

    const response = await axios.post(url, data, { headers });
    return this.transformResponse(response.data);
  }

  getModels() {
    return this.models;
  }

  transformResponse(response) {
    return {
      id: response.id,
      model: response.model,
      provider: this.providerName,
      choices: [{
        message: {
          role: 'assistant',
          content: response.content[0].text,
        },
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}

module.exports = AnthropicAdapter;