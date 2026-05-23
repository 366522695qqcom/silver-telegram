const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const totalRequests = await query(
      'SELECT COUNT(*) as count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)',
      [req.user.id]
    );
    const successCount = await query(
      'SELECT COUNT(*) as count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) AND status_code = 200',
      [req.user.id]
    );
    const avgLatency = await query(
      'SELECT AVG(latency) as avg FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)',
      [req.user.id]
    );

    const total = Number(totalRequests.rows[0]?.count) || 0;
    const success = Number(successCount.rows[0]?.count) || 0;
    const error = total - success;

    res.json({
      totalRequests: total,
      successCount: success,
      errorCount: error,
      avgLatency: Math.round(Number(avgLatency.rows[0]?.avg) || 0),
      activeConnections: 1,
    });
  } catch (error) {
    res.json({
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      avgLatency: 0,
      activeConnections: 0,
    });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [totalRequests, todayRequests, avgLatency, successRate, providerStats] = await Promise.all([
      query('SELECT COUNT(*) as count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)', [req.user.id]),
      query("SELECT COUNT(*) as count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) AND created_at >= datetime('now', '-8 hours', 'start of day', '+8 hours')", [req.user.id]),
      query('SELECT AVG(latency) as avg FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)', [req.user.id]),
      query('SELECT SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success_count, COUNT(*) as total_count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)', [req.user.id]),
      query('SELECT provider, COUNT(*) as count, AVG(latency) as avg_latency, SUM(cost) as total_cost FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) GROUP BY provider', [req.user.id]),
    ]);

    const successCount = Number(successRate.rows[0]?.success_count) || 0;
    const totalCount = Number(successRate.rows[0]?.total_count) || 0;
    const successRatePercent = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    const topProviders = providerStats.rows
      .map(row => ({ provider: row.provider, count: Number(row.count) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const modelStats = await query(
      'SELECT model, COUNT(*) as count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) GROUP BY model ORDER BY count DESC LIMIT 5',
      [req.user.id]
    );

    res.json({
      total_requests: Number(totalRequests.rows[0]?.count) || 0,
      today_requests: Number(todayRequests.rows[0]?.count) || 0,
      avg_latency_ms: Math.round(Number(avgLatency.rows[0]?.avg) || 0),
      success_rate: successRatePercent,
      provider_stats: providerStats.rows.map(row => ({
        provider: row.provider,
        count: Number(row.count) || 0,
        avg_latency_ms: Math.round(Number(row.avg_latency) || 0),
        total_cost: Number(row.total_cost) || 0,
      })),
      top_providers: topProviders,
      top_models: modelStats.rows.map(row => ({
        model: row.model,
        count: Number(row.count) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        strftime('%Y-%m-%d', created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success_count
      FROM requests 
      WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)
        AND created_at >= datetime('now', '-6 days')
      GROUP BY date
      ORDER BY date
    `, [req.user.id]);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = result.rows.find(r => r.date === dateStr);
      days.push({
        date: dateStr,
        label: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
        count: found ? Number(found.count) || 0 : 0,
        success_count: found ? Number(found.success_count) || 0 : 0,
      });
    }
    res.json(days);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      'SELECT id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost, error_message, created_at FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, Number(limit), offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      'SELECT id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost, error_message, created_at FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, Number(limit), offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/hourly', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as count,
        AVG(latency) as avg_latency,
        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success_count,
        SUM(cost) as total_cost
      FROM requests 
      WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)
        AND created_at >= datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour
    `, [req.user.id]);

    res.json(result.rows.map(row => ({
      hour: row.hour,
      count: Number(row.count) || 0,
      avg_latency_ms: Math.round(Number(row.avg_latency) || 0),
      success_count: Number(row.success_count) || 0,
      total_cost: Number(row.total_cost) || 0,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/models', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT model, COUNT(*) as count, AVG(latency) as avg_latency, SUM(cost) as total_cost
      FROM requests 
      WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)
      GROUP BY model
      ORDER BY count DESC
    `, [req.user.id]);

    res.json(result.rows.map(row => ({
      model: row.model,
      count: Number(row.count) || 0,
      avg_latency_ms: Math.round(Number(row.avg_latency) || 0),
      total_cost: Number(row.total_cost) || 0,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
