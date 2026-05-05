const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, key_value, enabled, rate_limit, created_at, expires_at FROM api_keys WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, expires_at, rate_limit } = req.body;
    const keyValue = uuidv4().replace(/-/g, '');

    const result = await pool.query(
      'INSERT INTO api_keys (user_id, key_value, name, expires_at, rate_limit) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, key_value, enabled, rate_limit, created_at, expires_at',
      [req.user.id, keyValue, name, expires_at, rate_limit || 1000]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, key_value, enabled, rate_limit, created_at, expires_at FROM api_keys WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, enabled, rate_limit, expires_at } = req.body;

    const result = await pool.query(
      'UPDATE api_keys SET name = COALESCE($1, name), enabled = COALESCE($2, enabled), rate_limit = COALESCE($3, rate_limit), expires_at = COALESCE($4, expires_at), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING id, name, key_value, enabled, rate_limit, created_at, expires_at',
      [name, enabled, rate_limit, expires_at, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;