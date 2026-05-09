const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');
const { updateStats } = require('../server');

const router = express.Router();

let globalStats = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  avgLatency: 0,
  activeConnections: 0,
};

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

    const total = parseInt(totalRequests.rows[0]?.count) || 0;
    const success = parseInt(successCount.rows[0]?.count) || 0;
    const error = total - success;

    res.json({
      totalRequests: total,
      successCount: success,
      errorCount: error,
      avgLatency: Math.round(parseFloat(avgLatency.rows[0]?.avg) || 0),
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
      query("SELECT COUNT(*) as count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) AND DATE(created_at) = DATE('now')", [req.user.id]),
      query('SELECT AVG(latency) as avg FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)', [req.user.id]),
      query('SELECT SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success_count, COUNT(*) as total_count FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)', [req.user.id]),
      query('SELECT provider, COUNT(*) as count, AVG(latency) as avg_latency, SUM(cost) as total_cost FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) GROUP BY provider', [req.user.id]),
    ]);

    const successCount = parseInt(successRate.rows[0]?.success_count) || 0;
    const totalCount = parseInt(successRate.rows[0]?.total_count) || 0;
    const successRatePercent = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    res.json({
      total_requests: parseInt(totalRequests.rows[0]?.count) || 0,
      today_requests: parseInt(todayRequests.rows[0]?.count) || 0,
      avg_latency_ms: Math.round(parseFloat(avgLatency.rows[0]?.avg) || 0),
      success_rate: successRatePercent,
      provider_stats: providerStats.rows.map(row => ({
        provider: row.provider,
        count: parseInt(row.count) || 0,
        avg_latency_ms: Math.round(parseFloat(row.avg_latency) || 0),
        total_cost: parseFloat(row.total_cost) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(
      'SELECT id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost, error_message, created_at FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      'SELECT id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost, error_message, created_at FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), parseInt(offset)]
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
      count: parseInt(row.count) || 0,
      avg_latency_ms: Math.round(parseFloat(row.avg_latency) || 0),
      success_count: parseInt(row.success_count) || 0,
      total_cost: parseFloat(row.total_cost) || 0,
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
      count: parseInt(row.count) || 0,
      avg_latency_ms: Math.round(parseFloat(row.avg_latency) || 0),
      total_cost: parseFloat(row.total_cost) || 0,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
