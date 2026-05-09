const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, name, key, enabled, created_at, expires_at FROM api_keys WHERE user_id = ?', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, expires_at } = req.body;
    const keyValue = uuidv4().replace(/-/g, '');
    const id = uuidv4();

    await run(
      'INSERT INTO api_keys (id, user_id, key, name, expires_at) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, keyValue, name, expires_at || null]
    );

    const result = await query('SELECT id, name, key, enabled, created_at, expires_at FROM api_keys WHERE id = ?', [id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, name, key, enabled, created_at, expires_at FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, enabled, expires_at } = req.body;

    const existing = await query('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (enabled !== undefined) {
      updateFields.push('enabled = ?');
      updateValues.push(enabled ? 1 : 0);
    }
    if (expires_at !== undefined) {
      updateFields.push('expires_at = ?');
      updateValues.push(expires_at);
    }

    updateValues.push(req.params.id);
    updateValues.push(req.user.id);

    await run(`UPDATE api_keys SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`, updateValues);

    const result = await query('SELECT id, name, key, enabled, created_at, expires_at FROM api_keys WHERE id = ?', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await query('SELECT id FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await run('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
