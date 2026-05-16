const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../utils/db');
const providerService = require('../services/providerService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, provider_name, provider_type, base_url, enabled, created_at, api_key, avg_latency, last_success_at, last_failed_at FROM providers WHERE user_id = ?',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/models', authenticateToken, async (req, res) => {
  try {
    const providersResult = await query(
      'SELECT * FROM providers WHERE user_id = ? AND enabled = 1 LIMIT 1',
      [req.user.id]
    );

    if (providersResult.rows.length === 0) {
      return res.json({ models: [] });
    }

    const provider = providersResult.rows[0];
    const models = await require('../services/providerService').getModels({
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM providers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(result.rows[0]);
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

    const id = uuidv4();
    await run(
      'INSERT INTO providers (id, user_id, provider_name, provider_type, api_key, base_url) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.user.id, provider_name, provider_type || 'openai', api_key, base_url]
    );

    const result = await query(
      'SELECT id, provider_name, provider_type, base_url, enabled, created_at, api_key, avg_latency, last_success_at, last_failed_at FROM providers WHERE id = ?',
      [id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { provider_name, provider_type, api_key, base_url, enabled } = req.body;

    const existing = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (provider_name !== undefined) {
      updateFields.push('provider_name = ?');
      updateValues.push(provider_name);
    }
    if (provider_type !== undefined) {
      updateFields.push('provider_type = ?');
      updateValues.push(provider_type);
    }
    if (api_key !== undefined) {
      updateFields.push('api_key = ?');
      updateValues.push(api_key);
    }
    if (base_url !== undefined) {
      updateFields.push('base_url = ?');
      updateValues.push(base_url);
    }
    if (enabled !== undefined) {
      updateFields.push('enabled = ?');
      updateValues.push(enabled ? 1 : 0);
    }

    updateValues.push(req.params.id);
    updateValues.push(req.user.id);

    await run(`UPDATE providers SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`, updateValues);

    const result = await query('SELECT id, provider_name, provider_type, base_url, enabled, created_at, api_key, avg_latency, last_success_at, last_failed_at FROM providers WHERE id = ?', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await query('SELECT id FROM providers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    await run('DELETE FROM providers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

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

router.post('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = result.rows[0];
    const newEnabled = provider.enabled ? 0 : 1;

    await run('UPDATE providers SET enabled = ? WHERE id = ? AND user_id = ?', [newEnabled, req.params.id, req.user.id]);

    const updated = await query('SELECT id, provider_name, provider_type, base_url, enabled, created_at, api_key, avg_latency, last_success_at, last_failed_at FROM providers WHERE id = ?', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/models', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
