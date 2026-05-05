const express = require('express');
const { query } = require('../utils/db');
const costService = require('../services/costService');
const quotaService = require('../services/quotaService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const usage = await costService.getMonthlyUsage(req.user.id, targetMonth, targetYear);
    res.json({
      month: targetMonth,
      year: targetYear,
      ...usage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      'SELECT r.id, r.provider, r.model, r.status_code, r.latency, r.prompt_tokens, r.completion_tokens, r.cost, r.created_at FROM requests r JOIN api_keys ak ON r.api_key_id = ak.id WHERE ak.user_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/quota', authenticateToken, async (req, res) => {
  try {
    const quota = await quotaService.getQuota(req.user.id);
    const checkResult = await quotaService.checkQuota(req.user.id);
    
    res.json({
      quota: {
        daily_requests: quota.daily_requests,
        monthly_cost_limit: parseFloat(quota.monthly_cost_limit),
        total_tokens_limit: quota.total_tokens_limit,
      },
      usage: checkResult.usage,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/quota', authenticateToken, async (req, res) => {
  try {
    const { daily_requests, monthly_cost_limit, total_tokens_limit } = req.body;
    
    const updatedQuota = await quotaService.updateQuota(
      req.user.id,
      daily_requests,
      monthly_cost_limit,
      total_tokens_limit
    );

    res.json({
      daily_requests: updatedQuota.daily_requests,
      monthly_cost_limit: parseFloat(updatedQuota.monthly_cost_limit),
      total_tokens_limit: updatedQuota.total_tokens_limit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/prices', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM prices');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/prices', authenticateToken, async (req, res) => {
  try {
    const { provider_name, model, prompt_price, completion_price } = req.body;
    
    await costService.setPrice(req.user.id, provider_name, model, prompt_price, completion_price);
    res.json({ message: 'Price configuration saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
