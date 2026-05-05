const OpenAIAdapter = require('./openaiAdapter');
const AnthropicAdapter = require('./anthropicAdapter');
const BaiduAdapter = require('./baiduAdapter');
const AlibabaAdapter = require('./alibabaAdapter');
const ZhipuAdapter = require('./zhipuAdapter');
const GeminiAdapter = require('./geminiAdapter');

class ProviderManager {
  constructor() {
    this.adapters = {
      openai: new OpenAIAdapter(),
      anthropic: new AnthropicAdapter(),
      baidu: new BaiduAdapter(),
      alibaba: new AlibabaAdapter(),
      zhipu: new ZhipuAdapter(),
      gemini: new GeminiAdapter(),
    };
  }

  getAdapter(providerName) {
    return this.adapters[providerName.toLowerCase()];
  }

  getAllProviders() {
    return Object.keys(this.adapters);
  }

  getModels(providerName) {
    const adapter = this.getAdapter(providerName);
    return adapter ? adapter.getModels() : [];
  }

  getAllModels() {
    const allModels = {};
    for (const [provider, adapter] of Object.entries(this.adapters)) {
      allModels[provider] = adapter.getModels();
    }
    return allModels;
  }

  async call(providerName, requestData, providerConfig) {
    const adapter = this.getAdapter(providerName);
    if (!adapter) {
      throw new Error(`Provider ${providerName} not supported`);
    }
    return await adapter.call(requestData, providerConfig);
  }
}

module.exports = new ProviderManager();