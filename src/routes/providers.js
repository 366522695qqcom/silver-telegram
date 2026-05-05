const express = require('express');
const pool = require('../config/database');
const providerService = require('../services/providerService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, provider_name, provider_type, base_url, enabled, created_at FROM providers WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { provider_name, provider_type, api_key, base_url } = req.body;

    if (!provider_name || !api_key || !base_url) {
      return res.status(400).json({ error: 'provider_name, api_key, and base_url are required' });
    }

    const result = await pool.query(
      `INSERT INTO providers (user_id, provider_name, provider_type, api_key, base_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, provider_name, provider_type, base_url, enabled, created_at`,
      [req.user.id, provider_name, provider_type || 'openai', api_key, base_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { provider_name, provider_type, api_key, base_url, enabled } = req.body;

    const result = await pool.query(
      `UPDATE providers 
       SET provider_name = COALESCE($1, provider_name),
           provider_type = COALESCE($2, provider_type),
           api_key = COALESCE($3, api_key),
           base_url = COALESCE($4, base_url),
           enabled = COALESCE($5, enabled)
       WHERE id = $6 AND user_id = $7 
       RETURNING id, provider_name, provider_type, base_url, enabled, created_at`,
      [provider_name, provider_type, api_key, base_url, enabled, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM providers WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM providers WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = result.rows[0];
    const testResult = await providerService.testConnection({
      base_url: provider.base_url,
      api_key: provider.api_key,
      provider_type: provider.provider_type,
    });

    res.json({
      provider_id: provider.id,
      provider_name: provider.provider_name,
      ...testResult,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/models', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM providers WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = result.rows[0];
    const models = await providerService.getModels({
      base_url: provider.base_url,
      api_key: provider.api_key,
      provider_type: provider.provider_type,
    });

    res.json({
      provider_id: provider.id,
      provider_name: provider.provider_name,
      models,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;