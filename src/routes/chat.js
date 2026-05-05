const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../utils/db');
const providerService = require('../services/providerService');
const routerService = require('../services/routerService');
const costService = require('../services/costService');
const cacheService = require('../utils/cache');
const RetryService = require('../utils/retry');
const { authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

router.post('/completions', authenticateApiKey, async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  let provider;

  try {
    const { provider_id, model, messages, max_tokens = 1000, temperature = 0.7, stream = false } = req.body;

    if (!model || !messages) {
      return res.status(400).json({ error: 'model and messages are required' });
    }

    if (!provider_id) {
      provider = await routerService.findBestProvider(req.apiKey.user_id, model);
    } else {
      const result = await query(
        'SELECT * FROM providers WHERE id = ? AND user_id = ? AND enabled = 1',
        [provider_id, req.apiKey.user_id]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Provider not found or disabled' });
      }
      provider = result.rows[0];
    }

    const cacheKey = cacheService.generateCacheKey({ model, messages, max_tokens, temperature });
    if (!stream) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        const latency = Date.now() - startTime;
        await run(
          'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, prompt_tokens, completion_tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [requestId, req.apiKey.id, provider.provider_name, model, 200, latency, cached.usage.prompt_tokens, cached.usage.completion_tokens]
        );
        return res.json(cached);
      }
    }

    const retryService = new RetryService();
    const result = await retryService.execute(async () => {
      return providerService.chatCompletion(
        {
          base_url: provider.base_url,
          api_key: provider.api_key,
          provider_type: provider.provider_type,
        },
        { model, messages, max_tokens, temperature, stream }
      );
    });

    const latency = Date.now() - startTime;

    if (result.isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      result.data.on('data', (chunk) => {
        res.write(chunk);
      });

      result.data.on('end', async () => {
        await routerService.recordProviderStatus(provider.id, true, latency);
        res.end();
      });

      result.data.on('error', async (err) => {
        await routerService.recordProviderStatus(provider.id, false, latency);
        res.status(500).end(JSON.stringify({ error: err.message }));
      });

      return;
    }

    if (result.success) {
      cacheService.set(cacheKey, result.data);
      
      const cost = await costService.calculateCost(
        provider.provider_name,
        model,
        result.data.usage?.prompt_tokens || 0,
        result.data.usage?.completion_tokens || 0
      );

      await run(
        'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          requestId,
          req.apiKey.id,
          provider.provider_name,
          model,
          200,
          latency,
          result.data.usage?.prompt_tokens,
          result.data.usage?.completion_tokens,
          cost,
        ]
      );

      await routerService.recordProviderStatus(provider.id, true, latency);
      res.json(result.data);
    } else {
      await run(
        'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [requestId, req.apiKey.id, provider.provider_name, model, result.status_code || 500, latency, result.error]
      );

      await routerService.recordProviderStatus(provider.id, false, latency);
      res.status(result.status_code || 500).json({ error: result.error });
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    await run(
      'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [requestId, req.apiKey.id, provider?.provider_name || 'unknown', req.body.model || 'unknown', 500, latency, error.message]
    );

    if (provider) {
      await routerService.recordProviderStatus(provider.id, false, latency);
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/embeddings', authenticateApiKey, async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const { provider_id, model, input, encoding_format = 'float' } = req.body;

    if (!model || !input) {
      return res.status(400).json({ error: 'model and input are required' });
    }

    let providers;
    if (provider_id) {
      providers = await query(
        'SELECT * FROM providers WHERE id = ? AND user_id = ? AND enabled = 1',
        [provider_id, req.apiKey.user_id]
      );
    } else {
      providers = await query(
        'SELECT * FROM providers WHERE user_id = ? AND enabled = 1',
        [req.apiKey.user_id]
      );
    }

    if (providers.rows.length === 0) {
      return res.status(400).json({ error: 'No enabled providers found' });
    }

    const provider = providers.rows[0];
    const result = await providerService.embeddings(
      {
        base_url: provider.base_url,
        api_key: provider.api_key,
        provider_type: provider.provider_type,
      },
      { model, input, encoding_format }
    );

    const latency = Date.now() - startTime;

    if (result.success) {
      await run(
        'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, prompt_tokens) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [requestId, req.apiKey.id, provider.provider_name, model, 200, latency, result.data.usage?.total_tokens]
      );
      res.json(result.data);
    } else {
      await run(
        'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [requestId, req.apiKey.id, provider.provider_name, model, result.status_code || 500, latency, result.error]
      );
      res.status(result.status_code || 500).json({ error: result.error });
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    await run(
      'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [requestId, req.apiKey.id, 'unknown', req.body.model || 'unknown', 500, latency, error.message]
    );
    res.status(500).json({ error: error.message });
  }
});

router.get('/providers', authenticateApiKey, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, provider_name, provider_type, base_url, enabled, avg_latency FROM providers WHERE user_id = ? AND enabled = 1',
      [req.apiKey.user_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/models', authenticateApiKey, async (req, res) => {
  try {
    const { provider_id } = req.query;
    let providers;

    if (provider_id) {
      providers = await query(
        'SELECT * FROM providers WHERE id = ? AND user_id = ? AND enabled = 1',
        [provider_id, req.apiKey.user_id]
      );
    } else {
      providers = await query(
        'SELECT * FROM providers WHERE user_id = ? AND enabled = 1',
        [req.apiKey.user_id]
      );
    }

    const allModels = [];
    for (const provider of providers.rows) {
      try {
        const models = await providerService.getModels({
          base_url: provider.base_url,
          api_key: provider.api_key,
          provider_type: provider.provider_type,
        });
        allModels.push(...models.map(m => ({
          ...m,
          provider_id: provider.id,
          provider_name: provider.provider_name,
        })));
      } catch (error) {
        continue;
      }
    }

    res.json(allModels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
