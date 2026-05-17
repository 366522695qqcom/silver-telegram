const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');
const providerService = require('../services/providerService');

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
    const { provider_id, model_name, model_id, model_type, capabilities, context_window, max_output_tokens, base_url, api_key } = req.body;

    if (!model_name || !model_id) {
      return res.status(400).json({ error: 'model_name and model_id are required' });
    }

    let finalBaseUrl = base_url || null;
    let finalApiKey = api_key || null;

    if (provider_id) {
      const providerResult = await query(
        'SELECT base_url, api_key FROM providers WHERE id = ? AND user_id = ?',
        [provider_id, req.user.id]
      );
      if (providerResult.rows.length > 0) {
        const provider = providerResult.rows[0];
        if (!finalBaseUrl) finalBaseUrl = provider.base_url;
        if (!finalApiKey) finalApiKey = provider.api_key;
      }
    }

    const id = uuidv4();
    await run(
      'INSERT INTO custom_models (id, user_id, provider_id, model_name, model_id, model_type, capabilities, context_window, max_output_tokens, base_url, api_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, provider_id || null, model_name, model_id, model_type || 'chat', capabilities || '{}', context_window || null, max_output_tokens || null, finalBaseUrl, finalApiKey]
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

    const { provider_id, model_name, model_id, model_type, capabilities, context_window, max_output_tokens, base_url, api_key, enabled } = req.body;
    const updateFields = [];
    const updateValues = [];

    if (provider_id !== undefined) { updateFields.push('provider_id = ?'); updateValues.push(provider_id || null); }
    if (model_name !== undefined) { updateFields.push('model_name = ?'); updateValues.push(model_name); }
    if (model_id !== undefined) { updateFields.push('model_id = ?'); updateValues.push(model_id); }
    if (base_url !== undefined) { updateFields.push('base_url = ?'); updateValues.push(base_url || null); }
    if (api_key !== undefined) { updateFields.push('api_key = ?'); updateValues.push(api_key || null); }
    if (enabled !== undefined) { updateFields.push('enabled = ?'); updateValues.push(enabled ? 1 : 0); }
    if (model_type !== undefined) { updateFields.push('model_type = ?'); updateValues.push(model_type); }
    if (capabilities !== undefined) { updateFields.push('capabilities = ?'); updateValues.push(capabilities); }
    if (context_window !== undefined) { updateFields.push('context_window = ?'); updateValues.push(context_window || null); }
    if (max_output_tokens !== undefined) { updateFields.push('max_output_tokens = ?'); updateValues.push(max_output_tokens || null); }

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

    let baseUrl = model.base_url;
    let apiKey = model.api_key;
    let providerType = 'openai';

    if (model.provider_id) {
      const providerResult = await query(
        'SELECT base_url, api_key, provider_type FROM providers WHERE id = ?',
        [model.provider_id]
      );
      if (providerResult.rows.length > 0) {
        const provider = providerResult.rows[0];
        if (!baseUrl) baseUrl = provider.base_url;
        if (!apiKey) apiKey = provider.api_key;
        providerType = provider.provider_type || 'openai';
      }
    }

    if (!baseUrl) {
      return res.json({
        success: false,
        message: 'No base URL configured for connectivity test',
      });
    }

    const headers = providerService.buildHeaders(providerType, apiKey || '');

    let endpoint = baseUrl.replace(/\/+$/, '');
    let body;

    if (providerType === 'anthropic') {
      endpoint += '/messages';
      body = JSON.stringify({
        model: model.model_id,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });
    } else {
      endpoint += '/chat/completions';
      body = JSON.stringify({
        model: model.model_id,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latency = Date.now() - startTime;

      if (response.ok) {
        res.json({
          success: true,
          message: `Chat completion test successful for model "${model.model_id}"`,
          latency_ms: latency,
        });
      } else {
        const text = await response.text().catch(() => '');
        res.json({
          success: false,
          message: `Chat completion test failed: HTTP ${response.status} - ${text.substring(0, 200)}`,
          latency_ms: latency,
        });
      }
    } catch (fetchError) {
      clearTimeout(timer);
      const latency = Date.now() - startTime;
      res.json({
        success: false,
        message: fetchError.name === 'AbortError'
          ? 'Connection timeout (15s)'
          : `Connection error: ${fetchError.message}`,
        latency_ms: latency,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;