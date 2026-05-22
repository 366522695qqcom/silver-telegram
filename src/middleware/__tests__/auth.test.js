jest.mock('jsonwebtoken');
jest.mock('../../utils/db');

const { authenticateToken, authenticateApiKey } = require('../auth');
const jwt = require('jsonwebtoken');
const { query } = require('../../utils/db');

const mockRes = () => {
  const res = { statusCode: 200 };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authenticateToken', () => {
  test('returns 401 when no token is provided', async () => {
    const req = { headers: {}, cookies: {} };
    const res = mockRes();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when jwt.verify throws an error', async () => {
    const req = { headers: { authorization: 'Bearer bad-token' }, cookies: {} };
    const res = mockRes();

    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(new Error('jwt malformed'), null);
    });

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when valid token but user not found in DB', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' }, cookies: {} };
    const res = mockRes();

    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { id: 1, email: 'test@test.com' });
    });
    query.mockResolvedValue({ rows: [] });

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when valid token and user found', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' }, cookies: {} };
    const res = mockRes();
    const user = { id: 1, email: 'test@test.com', name: 'Test' };

    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { id: 1, email: 'test@test.com' });
    });
    query.mockResolvedValue({ rows: [user] });

    await authenticateToken(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authenticateApiKey', () => {
  test('returns 401 when no API key is provided', async () => {
    const req = { headers: {}, cookies: {} };
    const res = mockRes();

    await authenticateApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when API key not found in DB', async () => {
    const req = { headers: { authorization: 'Bearer unknown-key' }, cookies: {} };
    const res = mockRes();

    query.mockResolvedValue({ rows: [] });

    await authenticateApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or disabled API key' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when API key is disabled (enabled=0)', async () => {
    const req = { headers: { authorization: 'Bearer test-key' }, cookies: {} };
    const res = mockRes();

    query.mockResolvedValue({
      rows: [{
        id: 1, user_id: 1, name: 'test', key: 'test-key',
        enabled: 0, created_at: '2024-01-01', expires_at: null, uid: 1
      }]
    });

    await authenticateApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key is disabled' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when API key is disabled (enabled="0" from Turso)', async () => {
    const req = { headers: { authorization: 'Bearer test-key' }, cookies: {} };
    const res = mockRes();

    query.mockResolvedValue({
      rows: [{
        id: 1, user_id: 1, name: 'test', key: 'test-key',
        enabled: '0', created_at: '2024-01-01', expires_at: null, uid: 1
      }]
    });

    await authenticateApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key is disabled' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when API key has expired', async () => {
    const req = { headers: { authorization: 'Bearer test-key' }, cookies: {} };
    const res = mockRes();

    query.mockResolvedValue({
      rows: [{
        id: 1, user_id: 1, name: 'test', key: 'test-key',
        enabled: 1, created_at: '2024-01-01', expires_at: '2020-01-01', uid: 1
      }]
    });

    await authenticateApiKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'API key has expired' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when valid API key', async () => {
    const req = { headers: { authorization: 'Bearer test-key' }, cookies: {} };
    const res = mockRes();
    const apiKeyData = {
      id: 1, user_id: 1, name: 'test', key: 'test-key',
      enabled: 1, created_at: '2024-01-01', expires_at: null, uid: 1
    };

    query.mockResolvedValue({ rows: [apiKeyData] });

    await authenticateApiKey(req, res, next);

    expect(req.apiKey).toEqual(apiKeyData);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
