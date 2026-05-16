const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ToolService = require('../services/toolService');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const tools = await ToolService.getTools(req.user.id);
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tool = await ToolService.getToolById(req.user.id, req.params.id);
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }
    res.json({ tool });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, type, schema, endpoint, auth_config, enabled } = req.body;
    if (!name || !type || !schema) {
      return res.status(400).json({ error: '名称、类型和架构为必填项' });
    }
    const tool = await ToolService.createTool(req.user.id, {
      name,
      description,
      type,
      schema,
      endpoint,
      auth_config,
      enabled
    });
    res.status(201).json({ tool });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, type, schema, endpoint, auth_config, enabled } = req.body;
    if (!name || !type || !schema) {
      return res.status(400).json({ error: '名称、类型和架构为必填项' });
    }
    const tool = await ToolService.updateTool(req.user.id, req.params.id, {
      name,
      description,
      type,
      schema,
      endpoint,
      auth_config,
      enabled
    });
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }
    res.json({ tool });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ToolService.deleteTool(req.user.id, req.params.id);
    res.json({ message: '工具已删除' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/execute', async (req, res) => {
  try {
    const tool = await ToolService.getToolById(req.user.id, req.params.id);
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }
    const result = await ToolService.executeTool(tool, req.body.parameters || {});
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
