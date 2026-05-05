const express = require('express');
const auditService = require('../services/auditService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await auditService.getUserLogs(req.user.id, limit, offset);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/action/:action', authenticateToken, async (req, res) => {
  try {
    const { action } = req.params;
    const logs = await auditService.getLogsByAction(req.user.id, action, 50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;