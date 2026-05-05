const axios = require('axios');
const BaseAdapter = require('./baseAdapter');

class ZhipuAdapter extends BaseAdapter {
  constructor() {
    super();
    this.providerName = 'zhipu';
    this.baseUrl = 'https://api.zhipuai.cn/v4';
    this.models = ['glm-4', 'glm-4-air', 'glm-3-turbo'];
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

module.exports = ZhipuAdapter;