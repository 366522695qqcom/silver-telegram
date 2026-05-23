jest.mock('axios');
const axios = require('axios');
const providerService = require('../providerService');

const config = {
  base_url: 'https://api.openai.com/v1',
  api_key: 'sk-test',
  provider_type: 'openai',
};

const chatRequestData = {
  model: 'gpt-4',
  messages: [{ role: 'user', content: '你好' }],
  max_tokens: 1000,
  temperature: 0.7,
  stream: false,
};

const embeddingsRequestData = {
  model: 'text-embedding-3-small',
  input: 'test',
  encoding_format: 'float',
};

describe('providerService error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('chatCompletion error tests', () => {
    it('handles non-standard error format (error is a string, not object)', async () => {
      axios.post.mockRejectedValue({
        response: { status: 401, data: { error: 'Unauthorized' } },
      });

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).not.toBe('');
      expect(result.error).not.toBeUndefined();
      expect(['Unauthorized', 'Provider error: HTTP 401']).toContain(result.error);
    });

    it('handles empty error response body', async () => {
      axios.post.mockRejectedValue({
        response: { status: 500, data: {} },
      });

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider error: HTTP 500');
    });

    it('handles connection timeout', async () => {
      axios.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 120000ms exceeded',
      });

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });

    it('handles network error', async () => {
      axios.post.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:443',
      });

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error: ECONNREFUSED');
    });

    it('handles standard OpenAI error format', async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } },
        },
      });

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('handles error with data.message (some providers use this)', async () => {
      axios.post.mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid model' } },
      });

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid model');
    });

    it('handles error with empty message string (the exact bug)', async () => {
      axios.post.mockRejectedValue({
        response: { status: 502, data: { error: { message: '' } } },
      });

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).not.toBe('');
      expect(result.error).not.toBeUndefined();
      expect(result.error).toBe('Provider error: HTTP 502');
    });

    it('handles unknown error with no properties', async () => {
      axios.post.mockRejectedValue(new Error(''));

      const result = await providerService.chatCompletion(config, chatRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('embeddings error tests', () => {
    it('handles non-standard error format for embeddings', async () => {
      axios.post.mockRejectedValue({
        response: { status: 401, data: { error: 'Unauthorized' } },
      });

      const result = await providerService.embeddings(config, embeddingsRequestData);

      expect(result.success).toBe(false);
      expect(result.error).not.toBe('');
      expect(result.error).not.toBeUndefined();
      expect(['Unauthorized', 'Provider error: HTTP 401']).toContain(result.error);
    });

    it('handles connection timeout for embeddings', async () => {
      axios.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 120000ms exceeded',
      });

      const result = await providerService.embeddings(config, embeddingsRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });
  });
});
