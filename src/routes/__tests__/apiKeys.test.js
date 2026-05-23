jest.mock('../../utils/db');
jest.mock('../../middleware/auth');

const express = require('express');
const request = require('supertest');
const apiKeysRoutes = require('../apiKeys');
const { query, run } = require('../../utils/db');
const { authenticateToken } = require('../../middleware/auth');

authenticateToken.mockImplementation((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

const app = express();
app.use(express.json());
app.use('/api-keys', apiKeysRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api-keys - List API keys', () => {
  test('Returns user\'s API keys array', async () => {
    const mockKeys = [
      { id: 'key-1', name: 'Key One', key: 'abc123', enabled: 1, created_at: '2024-01-01', expires_at: null },
      { id: 'key-2', name: 'Key Two', key: 'def456', enabled: 0, created_at: '2024-01-02', expires_at: '2025-01-01' },
    ];
    query.mockResolvedValue({ rows: mockKeys });

    const res = await request(app).get('/api-keys');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockKeys);
    expect(query).toHaveBeenCalledWith(
      'SELECT id, name, "key", enabled, created_at, expires_at FROM api_keys WHERE user_id = ?',
      ['test-user-id']
    );
  });
});

describe('POST /api-keys - Create API key', () => {
  test('Creates a new key and returns it with 201 status', async () => {
    const newKey = { id: 'new-id', name: 'My Key', key: 'generatedkey', enabled: 1, created_at: '2024-01-01', expires_at: null };
    run.mockResolvedValue();
    query.mockResolvedValue({ rows: [newKey] });

    const res = await request(app)
      .post('/api-keys')
      .send({ name: 'My Key' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(newKey);
    expect(run).toHaveBeenCalledWith(
      'INSERT INTO api_keys (id, user_id, "key", name, expires_at) VALUES (?, ?, ?, ?, ?)',
      expect.arrayContaining(['test-user-id', 'My Key', null])
    );
    expect(query).toHaveBeenCalledWith(
      'SELECT id, name, "key", enabled, created_at, expires_at FROM api_keys WHERE id = ?',
      [expect.any(String)]
    );
  });
});

describe('POST /api-keys/:id/toggle - Toggle API key status', () => {
  test('Toggles enabled from 1 to 0', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'key-1', enabled: 1 }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'key-1', name: 'Test', key: 'abc', enabled: 0, created_at: '2024-01-01', expires_at: null }] });
    run.mockResolvedValue();

    const res = await request(app).post('/api-keys/key-1/toggle');

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(0);
    expect(run).toHaveBeenCalledWith(
      'UPDATE api_keys SET enabled = ? WHERE id = ? AND user_id = ?',
      [0, 'key-1', 'test-user-id']
    );
  });

  test('Toggles enabled from 0 to 1', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'key-1', enabled: 0 }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'key-1', name: 'Test', key: 'abc', enabled: 1, created_at: '2024-01-01', expires_at: null }] });
    run.mockResolvedValue();

    const res = await request(app).post('/api-keys/key-1/toggle');

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(1);
    expect(run).toHaveBeenCalledWith(
      'UPDATE api_keys SET enabled = ? WHERE id = ? AND user_id = ?',
      [1, 'key-1', 'test-user-id']
    );
  });

  test('Toggles enabled from string "0" to 1 (Turso integer type)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'key-1', enabled: '0' }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'key-1', name: 'Test', key: 'abc', enabled: 1, created_at: '2024-01-01', expires_at: null }] });
    run.mockResolvedValue();

    const res = await request(app).post('/api-keys/key-1/toggle');

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(1);
    expect(run).toHaveBeenCalledWith(
      'UPDATE api_keys SET enabled = ? WHERE id = ? AND user_id = ?',
      [1, 'key-1', 'test-user-id']
    );
  });

  test('Returns 404 if key not found', async () => {
    query.mockResolvedValue({ rows: [] });

    const res = await request(app).post('/api-keys/nonexistent/toggle');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'API key not found' });
  });
});

describe('DELETE /api-keys/:id - Delete API key', () => {
  test('Deletes associated requests first, then the key', async () => {
    query.mockResolvedValue({ rows: [{ id: 'key-1' }] });
    run.mockResolvedValue();

    const res = await request(app).delete('/api-keys/key-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'API key deleted successfully' });
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenNthCalledWith(1, 'DELETE FROM requests WHERE api_key_id = ?', ['key-1']);
    expect(run).toHaveBeenNthCalledWith(2, 'DELETE FROM api_keys WHERE id = ? AND user_id = ?', ['key-1', 'test-user-id']);
  });

  test('Returns 404 if key not found', async () => {
    query.mockResolvedValue({ rows: [] });

    const res = await request(app).delete('/api-keys/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'API key not found' });
    expect(run).not.toHaveBeenCalled();
  });
});
