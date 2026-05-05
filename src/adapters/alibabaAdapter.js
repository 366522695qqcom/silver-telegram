const axios = require('axios');
const BaseAdapter = require('./baseAdapter');

class AlibabaAdapter extends BaseAdapter {
  constructor() {
    super();
    this.providerName = 'alibaba';
    this.baseUrl = 'https://dashscope.aliyuncs.com/api';
    this.models = ['qwen-7b-chat', 'qwen-14b-chat', 'qwen-plus', 'qwen-max'];
  }

  async call(requestData, providerConfig) {
    const url = `${providerConfig.base_url || this.baseUrl}/v1/services/aigc/text-generation/generation`;
    const headers = {
      'Authorization': `Bearer ${providerConfig.api_key}`,
      'Content-Type': 'application/json',
    };

    const data = {
      model: requestData.model,
      input: {
        messages: requestData.messages,
      },
      parameters: {
        max_tokens: requestData.max_tokens,
        temperature: requestData.temperature,
      },
    };

    const response = await axios.post(url, data, { headers });
    return this.transformResponse(response.data);
  }

  getModels() {
    return this.models;
  }

  transformResponse(response) {
    return {
      id: response.output.task_id,
      model: response.output.model,
      provider: this.providerName,
      choices: [{
        message: {
          role: 'assistant',
          content: response.output.text,
        },
      }],
      usage: response.usage,
    };
  }
}

module.exports = AlibabaAdapter;