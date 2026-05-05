const { query, run } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

class AuditService {
  async log(userId, action, resourceType, resourceId, details, ipAddress) {
    const id = uuidv4();
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
    await run(
      'INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, action, resourceType, resourceId, detailsStr, ipAddress]
    );
  }

  async getUserLogs(userId, limit = 100, offset = 0) {
    const result = await query(
      'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    return result.rows;
  }

  async getLogsByAction(userId, action, limit = 50) {
    const result = await query(
      'SELECT * FROM audit_logs WHERE user_id = ? AND action = ? ORDER BY created_at DESC LIMIT ?',
      [userId, action, limit]
    );
    return result.rows;
  }
}

module.exports = new AuditService();
