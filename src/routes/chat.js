const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../utils/db');
const providerService = require('../services/providerService');
const routerService = require('../services/routerService');
const costService = require('../services/costService');
const cacheService = require('../utils/cache');
const RetryService = require('../utils/retry');
const ToolService = require('../services/toolService');
const { authenticateApiKey } = require('../middleware/auth');

const MAX_TOOL_ITERATIONS = 10;

async function executeToolCall(userId, toolCall) {
  const functionName = toolCall.function.name;
  let functionArgs = {};
  try {
    functionArgs = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    return { error: `Invalid JSON in tool arguments: ${e.message}` };
  }

  try {
    const tools = await ToolService.getTools(userId);
    const matchedTool = tools.find(t => t.name === functionName && t.enabled);

    if (matchedTool) {
      const result = await ToolService.executeTool(matchedTool, functionArgs);
      return result;
    }

    return { error: `Tool "${functionName}" not found in gateway registry. Raw tool_calls returned to client.` };
  } catch (error) {
    return { error: error.message };
  }
}

const router = express.Router();

router.post('/completions', authenticateApiKey, async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  let provider;

  try {
    const { 
      provider_id, model, messages, max_tokens = 1000, 
      temperature = 0.7, stream = false, tools, tool_choice 
    } = req.body;

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

    if (stream) {
      const retryService = new RetryService();
      const result = await retryService.execute(async () => {
        return providerService.chatCompletion(
          {
            base_url: provider.base_url,
            api_key: provider.api_key,
            provider_type: provider.provider_type,
          },
          { model, messages, max_tokens, temperature, stream: true, tools, tool_choice }
        );
      });

      if (result.isStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        result.data.on('data', (chunk) => res.write(chunk));
        result.data.on('end', async () => {
          await routerService.recordProviderStatus(provider.id, true, Date.now() - startTime);
          res.end();
        });
        result.data.on('error', async (err) => {
          await routerService.recordProviderStatus(provider.id, false, Date.now() - startTime);
          res.status(500).end(JSON.stringify({ error: err.message }));
        });
      } else {
        await routerService.recordProviderStatus(provider.id, false, Date.now() - startTime);
        res.status(result.status_code || 500).json({ error: result.error });
      }
      return;
    }

    const cacheKey = cacheService.generateCacheKey({ model, messages, max_tokens, temperature });
    const cached = cacheService.get(cacheKey);
    if (cached) {
      const latency = Date.now() - startTime;
      await run(
        'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, prompt_tokens, completion_tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [requestId, req.apiKey.id, provider.provider_name, model, 200, latency, cached.usage?.prompt_tokens, cached.usage?.completion_tokens]
      );
      return res.json(cached);
    }

    let currentMessages = [...messages];
    let finalResponse = null;
    let iteration = 0;

    while (iteration < MAX_TOOL_ITERATIONS) {
      iteration++;

      const retryService = new RetryService();
      const result = await retryService.execute(async () => {
        return providerService.chatCompletion(
          {
            base_url: provider.base_url,
            api_key: provider.api_key,
            provider_type: provider.provider_type,
          },
          { model, messages: currentMessages, max_tokens, temperature, stream: false, tools, tool_choice }
        );
      });

      if (!result.success) {
        await run(
          'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [requestId, req.apiKey.id, provider.provider_name, model, result.status_code || 500, Date.now() - startTime, result.error]
        );
        await routerService.recordProviderStatus(provider.id, false, Date.now() - startTime);
        return res.status(result.status_code || 500).json({ error: result.error });
      }

      const responseData = result.data;
      const choice = responseData.choices?.[0];

      if (!choice?.message?.tool_calls || choice.finish_reason !== 'tool_calls') {
        finalResponse = responseData;
        break;
      }

      currentMessages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const toolResult = await executeToolCall(req.apiKey.user_id, toolCall);
        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    if (!finalResponse) {
      finalResponse = {
        id: uuidv4(),
        object: 'chat.completion',
        model,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: 'Tool calling loop reached maximum iterations.' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };
    }

    const latency = Date.now() - startTime;
    cacheService.set(cacheKey, finalResponse);

    const cost = await costService.calculateCost(
      provider.provider_name,
      model,
      finalResponse.usage?.prompt_tokens || 0,
      finalResponse.usage?.completion_tokens || 0
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
        finalResponse.usage?.prompt_tokens,
        finalResponse.usage?.completion_tokens,
        cost,
      ]
    );

    await routerService.recordProviderStatus(provider.id, true, latency);
    res.json(finalResponse);
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
