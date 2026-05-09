const express = require('express');
const authMiddleware = require('../middleware/auth');
const WebhookService = require('../services/webhookService');

const router = express.Router();

router.use(authMiddleware);

router.post('/test', async (req, res) => {
  try {
    const { webhook_url, webhook_secret } = req.body;
    if (!webhook_url) {
      return res.status(400).json({ error: 'webhook_url 为必填项' });
    }
    const result = await WebhookService.testWebhook(webhook_url, webhook_secret);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
