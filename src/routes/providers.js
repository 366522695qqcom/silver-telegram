const express = require('express');
const pool = require('../config/database');
const providerManager = require('../adapters/providerManager');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  res.json(providerManager.getAllProviders());
});

router.get('/config', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, provider_name, enabled, created_at FROM providers WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/config', authenticateToken, async (req, res) => {
  try {
    const { provider_name, api_key, base_url, secret_key } = req.body;

    if (!provider_name || !api_key) {
      return res.status(400).json({ error: 'provider_name and api_key are required' });
    }

    const existing = await pool.query(
      'SELECT id FROM providers WHERE user_id = $1 AND provider_name = $2',
      [req.user.id, provider_name]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE providers SET api_key = $1, base_url = $2, secret_key = $3, enabled = true WHERE id = $4 RETURNING id, provider_name, enabled, created_at',
        [api_key, base_url, secret_key, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO providers (user_id, provider_name, api_key, base_url, secret_key) VALUES ($1, $2, $3, $4, $5) RETURNING id, provider_name, enabled, created_at',
        [req.user.id, provider_name, api_key, base_url, secret_key]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/config/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM providers WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider config not found' });
    }

    res.json({ message: 'Provider config deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;