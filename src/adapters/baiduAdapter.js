const axios = require('axios');
const BaseAdapter = require('./baseAdapter');

class BaiduAdapter extends BaseAdapter {
  constructor() {
    super();
    this.providerName = 'baidu';
    this.baseUrl = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat';
    this.models = ['ernie-3.5', 'ernie-4.0', 'ernie-turbo'];
  }

  async call(requestData, providerConfig) {
    const url = `${providerConfig.base_url || this.baseUrl}/completions`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const data = {
      model: requestData.model,
      messages: requestData.messages,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature,
      api_key: providerConfig.api_key,
      secret_key: providerConfig.secret_key,
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
          content: response.result,
        },
      }],
      usage: {
        prompt_tokens: response.usage.total_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      },
    };
  }
}

module.exports = BaiduAdapter;