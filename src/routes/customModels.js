const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT cm.*, p.provider_name FROM custom_models cm LEFT JOIN providers p ON cm.provider_id = p.id WHERE cm.user_id = ? ORDER BY cm.created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { provider_id, model_name, model_id, base_url, api_key } = req.body;

    if (!model_name || !model_id) {
      return res.status(400).json({ error: 'model_name and model_id are required' });
    }

    const id = uuidv4();
    await run(
      'INSERT INTO custom_models (id, user_id, provider_id, model_name, model_id, base_url, api_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, provider_id || null, model_name, model_id, base_url || null, api_key || null]
    );

    const result = await query(
      'SELECT cm.*, p.provider_name FROM custom_models cm LEFT JOIN providers p ON cm.provider_id = p.id WHERE cm.id = ?',
      [id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await query(
      'SELECT * FROM custom_models WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Custom model not found' });
    }

    const { provider_id, model_name, model_id, base_url, api_key, enabled } = req.body;
    const updateFields = [];
    const updateValues = [];

    if (provider_id !== undefined) { updateFields.push('provider_id = ?'); updateValues.push(provider_id || null); }
    if (model_name !== undefined) { updateFields.push('model_name = ?'); updateValues.push(model_name); }
    if (model_id !== undefined) { updateFields.push('model_id = ?'); updateValues.push(model_id); }
    if (base_url !== undefined) { updateFields.push('base_url = ?'); updateValues.push(base_url || null); }
    if (api_key !== undefined) { updateFields.push('api_key = ?'); updateValues.push(api_key || null); }
    if (enabled !== undefined) { updateFields.push('enabled = ?'); updateValues.push(enabled ? 1 : 0); }

    if (updateFields.length > 0) {
      updateValues.push(req.params.id);
      updateValues.push(req.user.id);
      await run(
        `UPDATE custom_models SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
        updateValues
      );
    }

    const result = await query(
      'SELECT cm.*, p.provider_name FROM custom_models cm LEFT JOIN providers p ON cm.provider_id = p.id WHERE cm.id = ?',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await run(
      `DELETE FROM custom_models WHERE id IN (${placeholders}) AND user_id = ?`,
      [...ids, req.user.id]
    );

    res.json({ message: 'Custom models deleted successfully', deleted_count: ids.length });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await run('DELETE FROM custom_models WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Custom model deleted successfully' });
  } catch (error) {
    console.error('Delete custom model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM custom_models WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom model not found' });
    }

    const model = result.rows[0];
    const newEnabled = model.enabled ? 0 : 1;
    await run(
      'UPDATE custom_models SET enabled = ? WHERE id = ? AND user_id = ?',
      [newEnabled, req.params.id, req.user.id]
    );

    const updated = await query(
      'SELECT cm.*, p.provider_name FROM custom_models cm LEFT JOIN providers p ON cm.provider_id = p.id WHERE cm.id = ?',
      [req.params.id]
    );
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM custom_models WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom model not found' });
    }

    const model = result.rows[0];
    const testUrl = model.base_url;
    const testKey = model.api_key;

    if (!testUrl) {
      return res.json({
        success: false,
        message: 'No base URL configured for connectivity test',
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const modelsUrl = testUrl.replace(/\/+$/, '') + (testUrl.endsWith('/v1') ? '/models' : '/v1/models');
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testKey || ''}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        const data = await response.json();
        const modelIds = data.data ? data.data.map(m => m.id) : [];
        const hasModel = modelIds.some(id => id === model.model_id || id.includes(model.model_id));

        res.json({
          success: true,
          status: response.status,
          message: hasModel
            ? `Connected successfully. Model "${model.model_id}" found.`
            : `Connected successfully but model "${model.model_id}" not found in provider's model list.`,
          availableModels: modelIds.slice(0, 20),
        });
      } else {
        const text = await response.text().catch(() => '');
        res.json({
          success: false,
          status: response.status,
          message: `Connection failed: HTTP ${response.status} - ${text.substring(0, 200)}`,
        });
      }
    } catch (fetchError) {
      clearTimeout(timer);
      res.json({
        success: false,
        message: fetchError.name === 'AbortError'
          ? 'Connection timeout (10s)'
          : `Connection error: ${fetchError.message}`,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;