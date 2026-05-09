const { query, run } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const ProviderService = require('./providerService');

class BatchService {
  static async getTasks(userId) {
    const result = await query('SELECT * FROM batch_tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return result.rows.map(row => ({
      ...row,
      requests: JSON.parse(row.requests),
      results: row.results ? JSON.parse(row.results) : null
    }));
  }

  static async getTaskById(userId, taskId) {
    const result = await query('SELECT * FROM batch_tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      ...result.rows[0],
      requests: JSON.parse(result.rows[0].requests),
      results: result.rows[0].results ? JSON.parse(result.rows[0].results) : null
    };
  }

  static async createTask(userId, apiKeyId, taskData) {
    const id = uuidv4();
    await run(
      'INSERT INTO batch_tasks (id, user_id, api_key_id, name, requests, strategy, timeout, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        userId,
        apiKeyId,
        taskData.name,
        JSON.stringify(taskData.requests),
        taskData.strategy || 'parallel',
        taskData.timeout || 300,
        'pending'
      ]
    );
    return this.getTaskById(userId, id);
  }

  static async executeTask(userId, taskId, provider) {
    const task = await this.getTaskById(userId, taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    await run(
      'UPDATE batch_tasks SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['processing', taskId]
    );

    try {
      let results;
      if (task.strategy === 'parallel') {
        results = await this.executeParallel(task.requests, provider, task.timeout);
      } else {
        results = await this.executeSerial(task.requests, provider, task.timeout);
      }

      await run(
        'UPDATE batch_tasks SET status = ?, results = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', JSON.stringify(results), taskId]
      );

      return this.getTaskById(userId, taskId);
    } catch (error) {
      await run(
        'UPDATE batch_tasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['failed', taskId]
      );
      throw error;
    }
  }

  static async executeParallel(requests, provider, timeout) {
    const promises = requests.map((req, index) =>
      this.executeSingleRequest(req, provider, index)
    );
    return Promise.all(promises);
  }

  static async executeSerial(requests, provider, timeout) {
    const results = [];
    for (let i = 0; i < requests.length; i++) {
      const result = await this.executeSingleRequest(requests[i], provider, i);
      results.push(result);
    }
    return results;
  }

  static async executeSingleRequest(request, provider, index) {
    try {
      const result = await ProviderService.chatCompletion(
        provider,
        request.model,
        request.messages,
        request
      );
      return {
        index,
        success: true,
        result
      };
    } catch (error) {
      return {
        index,
        success: false,
        error: error.message
      };
    }
  }

  static async deleteTask(userId, taskId) {
    await run('DELETE FROM batch_tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
  }
}

module.exports = BatchService;
