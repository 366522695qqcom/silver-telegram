const { query, run } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class ToolService {
  static async getTools(userId) {
    const result = await query('SELECT * FROM tools WHERE user_id = ?', [userId]);
    return result.rows.map(row => ({
      ...row,
      schema: JSON.parse(row.schema),
      auth_config: row.auth_config ? JSON.parse(row.auth_config) : null
    }));
  }

  static async getToolById(userId, toolId) {
    const result = await query('SELECT * FROM tools WHERE id = ? AND user_id = ?', [toolId, userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      ...result.rows[0],
      schema: JSON.parse(result.rows[0].schema),
      auth_config: result.rows[0].auth_config ? JSON.parse(result.rows[0].auth_config) : null
    };
  }

  static async createTool(userId, toolData) {
    const id = uuidv4();
    await run(
      'INSERT INTO tools (id, user_id, name, description, type, schema, endpoint, auth_config, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        userId,
        toolData.name,
        toolData.description || null,
        toolData.type,
        JSON.stringify(toolData.schema),
        toolData.endpoint || null,
        toolData.auth_config ? JSON.stringify(toolData.auth_config) : null,
        toolData.enabled !== false ? 1 : 0
      ]
    );
    return this.getToolById(userId, id);
  }

  static async updateTool(userId, toolId, toolData) {
    await run(
      'UPDATE tools SET name = ?, description = ?, type = ?, schema = ?, endpoint = ?, auth_config = ?, enabled = ? WHERE id = ? AND user_id = ?',
      [
        toolData.name,
        toolData.description || null,
        toolData.type,
        JSON.stringify(toolData.schema),
        toolData.endpoint || null,
        toolData.auth_config ? JSON.stringify(toolData.auth_config) : null,
        toolData.enabled !== false ? 1 : 0,
        toolId,
        userId
      ]
    );
    return this.getToolById(userId, toolId);
  }

  static async deleteTool(userId, toolId) {
    await run('DELETE FROM tools WHERE id = ? AND user_id = ?', [toolId, userId]);
  }

  static async executeTool(tool, parameters) {
    if (tool.type === 'builtin') {
      return this.executeBuiltinTool(tool, parameters);
    } else {
      return this.executeCustomTool(tool, parameters);
    }
  }

  static async executeBuiltinTool(tool, parameters) {
    const toolName = tool.name.toLowerCase();
    
    switch (toolName) {
      case 'calculator':
        return this.calculate(parameters);
      case 'web_search':
        return this.webSearch(parameters);
      default:
        throw new Error(`未知的内置工具: ${tool.name}`);
    }
  }

  static calculate(parameters) {
    try {
      const { expression } = parameters;
      if (!expression) {
      }
      const result = eval(expression);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static webSearch(parameters) {
    return {
      success: true,
      result: '搜索功能暂未实现',
      parameters
    };
  }

  static async executeCustomTool(tool, parameters) {
    try {
      if (!tool.endpoint) {
      }
      
      const headers = {
        'Content-Type': 'application/json'
      };

      if (tool.auth_config) {
        Object.assign(headers, tool.auth_config.headers || {});
      }

      const response = await axios.post(tool.endpoint, parameters, { headers });
      
      return {
        success: true,
        result: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ToolService;
