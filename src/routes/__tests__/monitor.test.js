jest.mock('../../utils/db');
jest.mock('../../middleware/auth');

const express = require('express');
const request = require('supertest');
const monitorRoutes = require('../monitor');
const { query } = require('../../utils/db');
const { authenticateToken } = require('../../middleware/auth');

authenticateToken.mockImplementation((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

const app = express();
app.use(express.json());
app.use('/monitor', monitorRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /monitor/realtime', () => {
  test('Returns correct stats when requests table has data', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: 10 }] });
    query.mockResolvedValueOnce({ rows: [{ count: 8 }] });
    query.mockResolvedValueOnce({ rows: [{ avg: 150.3 }] });

    const res = await request(app).get('/monitor/realtime');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalRequests: 10,
      successCount: 8,
      errorCount: 2,
      avgLatency: 150,
      activeConnections: 1,
    });
  });

  test('Returns zeros when requests table has no data', async () => {
    query.mockResolvedValue({ rows: [{ count: null, avg: null }] });

    const res = await request(app).get('/monitor/realtime');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      avgLatency: 0,
      activeConnections: 1,
    });
  });
});

describe('GET /monitor/stats', () => {
  test('Returns complete stats when requests table has data', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '100' }] });
    query.mockResolvedValueOnce({ rows: [{ count: '15' }] });
    query.mockResolvedValueOnce({ rows: [{ avg: '250.7' }] });
    query.mockResolvedValueOnce({ rows: [{ success_count: '85', total_count: '100' }] });
    query.mockResolvedValueOnce({ rows: [{ provider: 'openai', count: '60', avg_latency: '200.5', total_cost: '1.25' }] });
    query.mockResolvedValueOnce({ rows: [{ model: 'gpt-4', count: '40' }] });

    const res = await request(app).get('/monitor/stats');

    expect(res.status).toBe(200);
    expect(res.body.total_requests).toBe(100);
    expect(res.body.today_requests).toBe(15);
    expect(res.body.avg_latency_ms).toBe(251);
    expect(res.body.success_rate).toBe(85);
    expect(res.body.top_providers).toEqual([{ provider: 'openai', count: 60 }]);
    expect(res.body.top_models).toEqual([{ model: 'gpt-4', count: 40 }]);
    expect(res.body.provider_stats).toEqual([
      { provider: 'openai', count: 60, avg_latency_ms: 201, total_cost: 1.25 },
    ]);
  });

  test('Returns zeros when requests table is empty', async () => {
    query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/monitor/stats');

    expect(res.status).toBe(200);
    expect(res.body.total_requests).toBe(0);
    expect(res.body.today_requests).toBe(0);
    expect(res.body.avg_latency_ms).toBe(0);
    expect(res.body.success_rate).toBe(0);
    expect(res.body.top_providers).toEqual([]);
    expect(res.body.top_models).toEqual([]);
  });
});

describe('GET /monitor/daily', () => {
  test('Handles Turso string-type values correctly', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    query.mockResolvedValue({ rows: [{ date: todayStr, count: '5', success_count: '3' }] });

    const res = await request(app).get('/monitor/daily');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);

    const todayEntry = res.body.find((d) => d.date === todayStr);
    expect(todayEntry).toBeDefined();
    expect(todayEntry.count).toBe(5);
    expect(todayEntry.success_count).toBe(3);
  });

  test('Returns 7 days with zero counts when no data exists', async () => {
    query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/monitor/daily');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);
    res.body.forEach((day) => {
      expect(day.count).toBe(0);
      expect(day.success_count).toBe(0);
    });
  });

  test('Returns correct Chinese weekday labels based on actual day of week', async () => {
    query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/monitor/daily');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);

    const expectedLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      expectedLabels.push(['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]);
    }

    const actualLabels = res.body.map((d) => d.label);
    expect(actualLabels).toEqual(expectedLabels);
  });
});