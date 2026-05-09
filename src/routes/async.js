const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const WebhookService = require('../services/webhookService');

const router = express.Router();

router.use(authenticateToken);

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await WebhookService.getTasks(req.user.id);
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await WebhookService.getTaskById(req.user.id, req.params.id);
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
    const { task_type, payload, webhook_url, webhook_secret } = req.body;
    if (!task_type || !payload) {
      return res.status(400).json({ error: 'task_type 和 payload 为必填项' });
    }
    const task = await WebhookService.createTask(req.user.id, {
      task_type,
      payload,
      webhook_url,
      webhook_secret
    });
    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await WebhookService.deleteTask(req.user.id, req.params.id);
    res.json({ message: '任务已删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
