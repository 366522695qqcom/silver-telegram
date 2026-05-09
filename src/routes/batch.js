const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const BatchService = require('../services/batchService');
const { query } = require('../utils/db');

const router = express.Router();

router.use(authenticateToken);

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await BatchService.getTasks(req.user.id);
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await BatchService.getTaskById(req.user.id, req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { name, requests, strategy, timeout, provider_id } = req.body;
    if (!name || !requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: '名称和请求列表为必填项' });
    }

    const apiKeysResult = await query('SELECT * FROM api_keys WHERE user_id = ? AND enabled = 1 LIMIT 1', [req.user.id]);
    if (apiKeysResult.rows.length === 0) {
      return res.status(400).json({ error: '请先创建一个 API 密钥' });
    }

    const task = await BatchService.createTask(req.user.id, apiKeysResult.rows[0].id, {
      name,
      requests,
      strategy,
      timeout
    });

    if (provider_id) {
      const providersResult = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [provider_id, req.user.id]);
      if (providersResult.rows.length > 0) {
        await BatchService.executeTask(req.user.id, task.id, providersResult.rows[0]);
      }
    }

    res.status(201).json({ task: await BatchService.getTaskById(req.user.id, task.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks/:id/execute', async (req, res) => {
  try {
    const { provider_id } = req.body;
    if (!provider_id) {
      return res.status(400).json({ error: 'provider_id 为必填项' });
    }

    const providersResult = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [provider_id, req.user.id]);
    if (providersResult.rows.length === 0) {
      return res.status(404).json({ error: '提供商不存在' });
    }

    const task = await BatchService.executeTask(req.user.id, req.params.id, providersResult.rows[0]);
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await BatchService.deleteTask(req.user.id, req.params.id);
    res.json({ message: '任务已删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
