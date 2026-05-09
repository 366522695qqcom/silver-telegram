const ProviderService = require('./providerService');
const axios = require('axios');

class VisionService {
  static async analyzeImage(provider, imageUrl, prompt = '描述这张图片') {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];

    const response = await ProviderService.chatCompletion(
      provider,
      provider.provider_type === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4-vision-preview',
      messages,
      { max_tokens: 1000 }
    );

    return {
      success: true,
      result: response
    };
  }

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

  static async visionChat(provider, messages, options = {}) {
    const response = await ProviderService.chatCompletion(
      provider,
      options.model || (provider.provider_type === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-4-vision-preview'),
      messages,
      options
    );

    return {
      success: true,
      result: response
    };
  }
}

module.exports = VisionService;
