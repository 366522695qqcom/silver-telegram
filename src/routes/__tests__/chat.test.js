jest.mock('../../utils/db');
jest.mock('../../middleware/auth');
jest.mock('../../services/providerService');
jest.mock('../../services/routerService');
jest.mock('../../services/costService');
jest.mock('../../utils/cache');
jest.mock('../../utils/retry');
jest.mock('../../utils/keyRotation');

const express = require('express');
const request = require('supertest');
const chatRoutes = require('../chat');
const { query, run } = require('../../utils/db');
const { authenticateApiKey } = require('../../middleware/auth');
const providerService = require('../../services/providerService');
const routerService = require('../../services/routerService');
const costService = require('../../services/costService');
const cacheService = require('../../utils/cache');
const RetryService = require('../../utils/retry');
const { selectApiKey } = require('../../utils/keyRotation');

authenticateApiKey.mockImplementation((req, res, next) => {
  req.apiKey = { id: 'test-api-key-id', user_id: 'test-user-id' };
  next();
});

selectApiKey.mockReturnValue('test-selected-api-key');

routerService.recordProviderStatus.mockResolvedValue();

costService.calculateCost.mockResolvedValue(0.005);

RetryService.mockImplementation(() => ({
  execute: (cb) => cb(),
}));

cacheService.get.mockReturnValue(null);
cacheService.set.mockImplementation(() => {});
cacheService.generateCacheKey = jest.fn().mockReturnValue('test-cache-key');

const app = express();
app.use(express.json());
app.use('/chat', chatRoutes);

const mockProvider = {
  id: 'prov-1',
  provider_name: 'OpenAI',
  provider_type: 'openai',
  base_url: 'https://api.openai.com/v1',
  api_key: 'sk-xxx',
};

beforeEach(() => {
  jest.clearAllMocks();
  cacheService.get.mockReturnValue(null);
  cacheService.set.mockImplementation(() => {});
  cacheService.generateCacheKey = jest.fn().mockReturnValue('test-cache-key');
  RetryService.mockImplementation(() => ({
    execute: (cb) => cb(),
  }));
});

describe('POST /chat/completions', () => {
  test('Successful chat completion records request with correct fields', async () => {
    query.mockResolvedValue({ rows: [mockProvider] });

    providerService.chatCompletion.mockResolvedValue({
      success: true,
      isStream: false,
      data: {
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        choices: [{ message: { content: 'Hello' } }],
      },
    });

    const res = await request(app)
      .post('/chat/completions')
      .send({
        provider_id: 'prov-1',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
      });

    expect(res.status).toBe(200);

    const runCalls = run.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO requests')
    );
    expect(runCalls.length).toBe(1);

    const [sql, params] = runCalls[0];
    expect(sql).toContain('INSERT INTO requests');
    expect(params).toEqual(
      expect.arrayContaining([
        expect.any(String),
        'test-api-key-id',
        'OpenAI',
        'gpt-4',
        200,
        expect.any(Number),
        100,
        50,
        0.005,
      ])
    );
    expect(params.length).toBe(9);
  });

  test('Failed chat completion records request with error_message', async () => {
    query.mockResolvedValue({ rows: [mockProvider] });

    providerService.chatCompletion.mockResolvedValue({
      success: false,
      status_code: 429,
      error: 'Rate limit exceeded',
    });

    const res = await request(app)
      .post('/chat/completions')
      .send({
        provider_id: 'prov-1',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
      });

    expect(res.status).toBe(429);

    const runCalls = run.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO requests')
    );
    expect(runCalls.length).toBe(1);

    const [sql, params] = runCalls[0];
    expect(sql).toContain('INSERT INTO requests');
    expect(sql).toContain('error_message');
    expect(params).toEqual(
      expect.arrayContaining([
        expect.any(String),
        'test-api-key-id',
        'OpenAI',
        'gpt-4',
        429,
        expect.any(Number),
        'Rate limit exceeded',
      ])
    );
    expect(params.length).toBe(7);
  });
});

describe('POST /chat/embeddings', () => {
  test('Successful embedding records request with correct fields', async () => {
    query.mockResolvedValue({ rows: [mockProvider] });

    providerService.embeddings.mockResolvedValue({
      success: true,
      data: {
        usage: { total_tokens: 200 },
      },
    });

    const res = await request(app)
      .post('/chat/embeddings')
      .send({
        model: 'text-embedding-3-small',
        input: 'test',
      });

    expect(res.status).toBe(200);

    const runCalls = run.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO requests')
    );
    expect(runCalls.length).toBe(1);

    const [sql, params] = runCalls[0];
    expect(sql).toContain('INSERT INTO requests');
    expect(params).toEqual(
      expect.arrayContaining([
        expect.any(String),
        'test-api-key-id',
        'OpenAI',
        'text-embedding-3-small',
        200,
        expect.any(Number),
        200,
      ])
    );
    expect(params.length).toBe(7);
  });
});

describe('POST /chat/completions validation', () => {
  test('Missing model and messages returns 400 without recording a request', async () => {
    const res = await request(app)
      .post('/chat/completions')
      .send({});

    expect(res.status).toBe(400);

    const runCalls = run.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO requests')
    );
    expect(runCalls.length).toBe(0);
  });
});