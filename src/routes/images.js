const express = require('express');
const authMiddleware = require('../middleware/auth');
const VisionService = require('../services/visionService');
const { query } = require('../utils/db');

const router = express.Router();

router.use(authMiddleware);

router.post('/generations', async (req, res) => {
  try {
    const { prompt, provider_id, options } = req.body;
    if (!prompt || !provider_id) {
      return res.status(400).json({ error: 'prompt 和 provider_id 为必填项' });
    }

    const providersResult = await query('SELECT * FROM providers WHERE id = ? AND user_id = ?', [provider_id, req.user.id]);
    if (providersResult.rows.length === 0) {
      return res.status(404).json({ error: '提供商不存在' });
    }

    const result = await VisionService.generateImage(providersResult.rows[0], prompt, options || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
