const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [totalRequests, todayRequests, avgLatency, successRate, providerStats, monthlyCost] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)', [req.user.id]),
      pool.query(`SELECT COUNT(*) FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1) AND created_at >= CURRENT_DATE`, [req.user.id]),
      pool.query('SELECT AVG(latency) FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)', [req.user.id]),
      pool.query(`SELECT (SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) * 100 AS success_rate FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)`, [req.user.id]),
      pool.query(`SELECT provider, COUNT(*) as count, AVG(latency) as avg_latency, SUM(cost) as total_cost FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1) GROUP BY provider`, [req.user.id]),
      pool.query(`SELECT SUM(cost) FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1) AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`, [req.user.id]),
    ]);

    res.json({
      total_requests: parseInt(totalRequests.rows[0].count),
      today_requests: parseInt(todayRequests.rows[0].count),
      avg_latency_ms: Math.round(parseFloat(avgLatency.rows[0].avg) || 0),
      success_rate: parseFloat(successRate.rows[0].success_rate) || 0,
      monthly_cost: parseFloat(monthlyCost.rows[0].sum) || 0,
      provider_stats: providerStats.rows.map(row => ({
        provider: row.provider,
        count: parseInt(row.count),
        avg_latency_ms: Math.round(parseFloat(row.avg_latency) || 0),
        total_cost: parseFloat(row.total_cost) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost, error_message, created_at FROM requests WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/hourly', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as count,
        AVG(latency) as avg_latency,
        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success_count,
        SUM(cost) as total_cost
      FROM requests 
      WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)
        AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `, [req.user.id]);

    res.json(result.rows.map(row => ({
      hour: row.hour,
      count: parseInt(row.count),
      avg_latency_ms: Math.round(parseFloat(row.avg_latency) || 0),
      success_count: parseInt(row.success_count),
      total_cost: parseFloat(row.total_cost) || 0,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/models', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT model, COUNT(*) as count, AVG(latency) as avg_latency, SUM(cost) as total_cost
      FROM requests 
      WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)
      GROUP BY model
      ORDER BY count DESC
    `, [req.user.id]);

    res.json(result.rows.map(row => ({
      model: row.model,
      count: parseInt(row.count),
      avg_latency_ms: Math.round(parseFloat(row.avg_latency) || 0),
      total_cost: parseFloat(row.total_cost) || 0,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;