const express = require('express');
const pool = require('../config/database');
const providerManager = require('../adapters/providerManager');
const { authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

router.post('/completions', authenticateApiKey, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { model, provider, messages, max_tokens = 1000, temperature = 0.7 } = req.body;

    if (!model || !provider || !messages) {
      return res.status(400).json({ error: 'model, provider, and messages are required' });
    }

    const providerConfigResult = await pool.query(
      'SELECT api_key, base_url, enabled FROM providers WHERE user_id = $1 AND provider_name = $2',
      [req.apiKey.user_id, provider]
    );

    if (providerConfigResult.rows.length === 0) {
      return res.status(400).json({ error: `Provider ${provider} not configured` });
    }

    const providerConfig = providerConfigResult.rows[0];
    if (!providerConfig.enabled) {
      return res.status(400).json({ error: `Provider ${provider} is disabled` });
    }

    const requestData = { model, messages, max_tokens, temperature };
    const response = await providerManager.call(provider, requestData, providerConfig);

    const latency = Date.now() - startTime;
    
    await pool.query(
      'INSERT INTO requests (api_key_id, provider, model, status_code, latency, prompt_tokens, completion_tokens) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        req.apiKey.id,
        provider,
        model,
        200,
        latency,
        response.usage?.prompt_tokens,
        response.usage?.completion_tokens,
      ]
    );

    res.json({ ...response, latency_ms: latency });
  } catch (error) {
    const latency = Date.now() - startTime;
    
    await pool.query(
      'INSERT INTO requests (api_key_id, provider, model, status_code, latency, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        req.apiKey.id,
        req.body.provider || 'unknown',
        req.body.model || 'unknown',
        error.response?.status || 500,
        latency,
        error.message,
      ]
    );

    res.status(500).json({ error: error.message });
  }
});

router.get('/models', authenticateApiKey, (req, res) => {
  res.json(providerManager.getAllModels());
});

module.exports = router;