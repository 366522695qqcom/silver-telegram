const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const RoutingService = require('../services/routingService');
const { query } = require('../utils/db');

const router = express.Router();

router.use(authenticateToken);

router.get('/rules', async (req, res) => {
  try {
    const rules = await RoutingService.getRules(req.user.id);
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/rules/:id', async (req, res) => {
  try {
    const rule = await RoutingService.getRuleById(req.user.id, req.params.id);
    if (!rule) {
      return res.status(404).json({ error: '规则不存在' });
    }
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/rules', async (req, res) => {
  try {
    const { name, strategy, model_filter, provider_priority, enabled } = req.body;
    if (!name || !strategy) {
      return res.status(400).json({ error: '名称和策略为必填项' });
    }
    const rule = await RoutingService.createRule(req.user.id, {
      name,
      strategy,
      model_filter,
      provider_priority,
      enabled
    });
    res.status(201).json({ rule });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/rules/:id', async (req, res) => {
  try {
    const { name, strategy, model_filter, provider_priority, enabled } = req.body;
    if (!name || !strategy) {
      return res.status(400).json({ error: '名称和策略为必填项' });
    }
    const rule = await RoutingService.updateRule(req.user.id, req.params.id, {
      name,
      strategy,
      model_filter,
      provider_priority,
      enabled
    });
    if (!rule) {
      return res.status(404).json({ error: '规则不存在' });
    }
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    await RoutingService.deleteRule(req.user.id, req.params.id);
    res.json({ message: '规则已删除' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/healthcheck', async (req, res) => {
  try {
    const providersResult = await query('SELECT * FROM providers WHERE user_id = ?', [req.user.id]);
    const results = await RoutingService.runHealthChecks(req.user.id, providersResult.rows);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
