const express = require('express');
const pool = require('../config/database');
const providerService = require('../services/providerService');
const { authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

router.post('/completions', authenticateApiKey, async (req, res) => {
  try {
    const { provider_id, model, messages, max_tokens, temperature, stream } = req.body;

    if (!provider_id || !model || !messages) {
      return res.status(400).json({ error: 'provider_id, model, and messages are required' });
    }

    const providerResult = await pool.query(
      'SELECT * FROM providers WHERE id = $1 AND user_id = $2 AND enabled = true',
      [provider_id, req.apiKey.user_id]
    );

    if (providerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Provider not found or disabled' });
    }

    const provider = providerResult.rows[0];

    const result = await providerService.chatCompletion(
      {
        base_url: provider.base_url,
        api_key: provider.api_key,
        provider_type: provider.provider_type,
      },
      { model, messages, max_tokens, temperature, stream }
    );

    await pool.query(
      `INSERT INTO requests (api_key_id, provider, model, status_code, latency, prompt_tokens, completion_tokens, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.apiKey.id,
        provider.provider_name,
        model,
        result.success ? 200 : result.status_code,
        result.latency_ms,
        result.data?.usage?.prompt_tokens,
        result.data?.usage?.completion_tokens,
        result.error,
      ]
    );

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status_code || 500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/providers', authenticateApiKey, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, provider_name, provider_type, base_url, enabled FROM providers WHERE user_id = $1 AND enabled = true',
      [req.apiKey.user_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;