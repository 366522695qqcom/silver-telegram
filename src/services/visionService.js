const ProviderService = require('./providerService');
const axios = require('axios');

class VisionService {
  static async generateImage(provider, prompt, options = {}) {
    if (provider.provider_type === 'anthropic') {
      throw new Error('Anthropic 不支持图像生成');
    }

    const url = `${provider.base_url}/images/generations`;
    const headers = ProviderService.buildHeaders(provider.provider_type, provider.api_key);
    const body = {
      model: options.model || 'dall-e-3',
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard'
    };

    const response = await axios.post(url, body, { headers });

    return {
      success: true,
      result: response.data
    };
  }
}

module.exports = VisionService;
