const pool = require('../config/database');

class AuditService {
  async log(userId, action, resourceType, resourceId, details, ipAddress) {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resourceType, resourceId, details, ipAddress]
    );
  }

  async getUserLogs(userId, limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  async getLogsByAction(userId, action, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 AND action = $2 
       ORDER BY created_at DESC 
       LIMIT $3`,
      [userId, action, limit]
    );
    return result.rows;
  }
}

module.exports = new AuditService();