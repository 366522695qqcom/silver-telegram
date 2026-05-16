const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const VisionService = require('../services/visionService');
const { query } = require('../utils/db');

const router = express.Router();

router.use(authenticateToken);

router.post('/analyze', async (req, res) => {
  try {
    const { image_url, prompt, provider_id } = req.body;
    if (!image_url || !provider_id) {
      return res.status(400).json({ error: 'image_url 和 provider_id 为必填项' });
    }

    const providersResult = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [provider_id, req.user.id]);
    if (providersResult.rows.length === 0) {
      return res.status(404).json({ error: '提供商不存在' });
    }

    const result = await VisionService.analyzeImage(providersResult.rows[0], image_url, prompt);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { messages, provider_id, options } = req.body;
    if (!messages || !provider_id) {
      return res.status(400).json({ error: 'messages 和 provider_id 为必填项' });
    }

    const providersResult = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [provider_id, req.user.id]);
    if (providersResult.rows.length === 0) {
      return res.status(404).json({ error: '提供商不存在' });
    }

    const result = await VisionService.visionChat(providersResult.rows[0], messages, options || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
