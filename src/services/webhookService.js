const { query, run } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const crypto = require('crypto');

class WebhookService {
  static async getTasks(userId) {
    const result = await query('SELECT * FROM async_tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return result.rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
      result: row.result ? JSON.parse(row.result) : null
    }));
  }

  static async getTaskById(userId, taskId) {
    const result = await query('SELECT * FROM async_tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      ...result.rows[0],
      payload: JSON.parse(result.rows[0].payload),
      result: result.rows[0].result ? JSON.parse(result.rows[0].result) : null
    };
  }

  static async createTask(userId, taskData) {
    const id = uuidv4();
    await run(
      'INSERT INTO async_tasks (id, user_id, task_type, payload, webhook_url, webhook_secret, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        userId,
        taskData.task_type,
        JSON.stringify(taskData.payload),
        taskData.webhook_url || null,
        taskData.webhook_secret || null,
        'pending'
      ]
    );
    return this.getTaskById(userId, id);
  }

  static async executeTask(userId, taskId, executeFn) {
    const task = await this.getTaskById(userId, taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    await run(
      'UPDATE async_tasks SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['processing', taskId]
    );

    try {
      const result = await executeFn(task.payload);
      
      await run(
        'UPDATE async_tasks SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', JSON.stringify(result), taskId]
      );

      if (task.webhook_url) {
        await this.sendWebhook(task, result, 'completed');
      }

      return this.getTaskById(userId, taskId);
    } catch (error) {
      await run(
        'UPDATE async_tasks SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['failed', error.message, taskId]
      );

      if (task.webhook_url) {
        await this.sendWebhook(task, null, 'failed', error.message);
      }

      throw error;
    }
  }

  static async sendWebhook(task, result, status, error = null) {
    try {
      const payload = {
        task_id: task.id,
        task_type: task.task_type,
        status,
        result,
        error,
        timestamp: new Date().toISOString()
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      if (task.webhook_secret) {
        const signature = this.generateSignature(payload, task.webhook_secret);
        headers['X-Webhook-Signature'] = signature;
      }

      await axios.post(task.webhook_url, payload, { headers });
    } catch (error) {
      console.error('Webhook 发送失败:', error);
    }
  }

  static generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  static async testWebhook(webhookUrl, webhookSecret = null) {
    try {
      const payload = {
        test: true,
        message: '这是一个测试 Webhook',
        timestamp: new Date().toISOString()
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      if (webhookSecret) {
        const signature = this.generateSignature(payload, webhookSecret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(webhookUrl, payload, { headers });

      return {
        success: true,
        status: response.status,
        message: 'Webhook 测试成功'
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: 'Webhook 测试失败: ' + error.message
      };
    }
  }

  static async deleteTask(userId, taskId) {
    await run('DELETE FROM async_tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
  }
}

module.exports = WebhookService;
