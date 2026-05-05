const { query, run } = require('../utils/db');

class QuotaService {
  async getQuota(userId) {
    const result = await query('SELECT * FROM user_quotas WHERE user_id = ?', [userId]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    await run('INSERT INTO user_quotas (user_id) VALUES (?)', [userId]);
    const newQuota = await query('SELECT * FROM user_quotas WHERE user_id = ?', [userId]);
    return newQuota.rows[0];
  }

  async checkQuota(userId, cost = 0, tokens = 0) {
    const quota = await this.getQuota(userId);

    const todayUsage = await query(
      'SELECT COUNT(*) as count FROM requests r JOIN api_keys ak ON r.api_key_id = ak.id WHERE ak.user_id = ? AND date(r.created_at) = date("now")',
      [userId]
    );

    const monthUsage = await query(
      'SELECT SUM(cost) as total_cost, SUM(prompt_tokens + COALESCE(completion_tokens, 0)) as total_tokens FROM requests r JOIN api_keys ak ON r.api_key_id = ak.id WHERE ak.user_id = ? AND strftime("%Y-%m", r.created_at) = strftime("%Y-%m", "now")',
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
    await run(
      'UPDATE user_quotas SET daily_requests = COALESCE(?, daily_requests), monthly_cost_limit = COALESCE(?, monthly_cost_limit), total_tokens_limit = COALESCE(?, total_tokens_limit), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [dailyRequests, monthlyCostLimit, totalTokensLimit, userId]
    );

    const result = await query('SELECT * FROM user_quotas WHERE user_id = ?', [userId]);
    return result.rows[0];
  }
}

module.exports = new QuotaService();
