const axios = require('axios');
const BaseAdapter = require('./baseAdapter');

class GeminiAdapter extends BaseAdapter {
  constructor() {
    super();
    this.providerName = 'gemini';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models';
    this.models = ['gemini-pro', 'gemini-ultra', 'gemini-nano'];
  }

  async call(requestData, providerConfig) {
    const url = `${providerConfig.base_url || this.baseUrl}/${requestData.model}:generateContent`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const data = {
      contents: requestData.messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        maxOutputTokens: requestData.max_tokens,
        temperature: requestData.temperature,
      },
    };

    const response = await axios.post(`${url}?key=${providerConfig.api_key}`, data, { headers });
    return this.transformResponse(response.data);
  }

  getModels() {
    return this.models;
  }

  transformResponse(response) {
    return {
      id: response.candidates[0].content.role,
      model: 'gemini-pro',
      provider: this.providerName,
      choices: [{
        message: {
          role: 'assistant',
          content: response.candidates[0].content.parts[0].text,
        },
      }],
      usage: {
        prompt_tokens: response.usageMetadata.promptTokenCount,
        completion_tokens: response.usageMetadata.candidatesTokenCount,
        total_tokens: response.usageMetadata.totalTokenCount,
      },
    };
  }
}

module.exports = GeminiAdapter;