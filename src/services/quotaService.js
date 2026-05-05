const pool = require('../config/database');

class QuotaService {
  async getQuota(userId) {
    const result = await pool.query(
      'SELECT * FROM user_quotas WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    const defaultQuota = await pool.query(
      `INSERT INTO user_quotas (user_id) VALUES ($1) RETURNING *`,
      [userId]
    );

    return defaultQuota.rows[0];
  }

  async checkQuota(userId, cost = 0, tokens = 0) {
    const quota = await this.getQuota(userId);

    const todayUsage = await pool.query(
      `SELECT COUNT(*) as count FROM requests r
       JOIN api_keys ak ON r.api_key_id = ak.id
       WHERE ak.user_id = $1 AND r.created_at >= CURRENT_DATE`,
      [userId]
    );

    const monthUsage = await pool.query(
      `SELECT SUM(cost) as total_cost, SUM(prompt_tokens + COALESCE(completion_tokens, 0)) as total_tokens
       FROM requests r
       JOIN api_keys ak ON r.api_key_id = ak.id
       WHERE ak.user_id = $1 AND r.created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );

    const todayCount = parseInt(todayUsage.rows[0].count) || 0;
    const totalCost = parseFloat(monthUsage.rows[0].total_cost) || 0;
    const totalTokens = parseInt(monthUsage.rows[0].total_tokens) || 0;

    const violations = [];
    if (todayCount >= quota.daily_requests) {
      violations.push(`Daily request limit exceeded (${todayCount}/${quota.daily_requests})`);
    }
    if (totalCost + cost > quota.monthly_cost_limit) {
      violations.push(`Monthly cost limit exceeded ($${(totalCost + cost).toFixed(2)}/$${quota.monthly_cost_limit})`);
    }
    if (totalTokens + tokens > quota.total_tokens_limit) {
      violations.push(`Total token limit exceeded (${totalTokens + tokens}/${quota.total_tokens_limit})`);
    }

    return {
      allowed: violations.length === 0,
      violations,
      usage: {
        today_requests: todayCount,
        monthly_cost: totalCost,
        total_tokens: totalTokens,
      },
      quota,
    };
  }

  async updateQuota(userId, dailyRequests, monthlyCostLimit, totalTokensLimit) {
    const result = await pool.query(
      `UPDATE user_quotas 
       SET daily_requests = COALESCE($1, daily_requests),
           monthly_cost_limit = COALESCE($2, monthly_cost_limit),
           total_tokens_limit = COALESCE($3, total_tokens_limit),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [dailyRequests, monthlyCostLimit, totalTokensLimit, userId]
    );

    return result.rows[0];
  }
}

module.exports = new QuotaService();