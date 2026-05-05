const axios = require('axios');
const BaseAdapter = require('./baseAdapter');

class OpenAIAdapter extends BaseAdapter {
  constructor() {
    super();
    this.providerName = 'openai';
    this.baseUrl = 'https://api.openai.com/v1';
    this.models = [
      'gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'
    ];
  }

  async call(requestData, providerConfig) {
    const url = `${providerConfig.base_url || this.baseUrl}/chat/completions`;
    const headers = {
      'Authorization': `Bearer ${providerConfig.api_key}`,
      'Content-Type': 'application/json',
    };

    const data = {
      model: requestData.model,
      messages: requestData.messages,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature,
      ...(requestData.stream && { stream: requestData.stream }),
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
      choices: response.choices,
      usage: response.usage,
    };
  }
}

module.exports = OpenAIAdapter;