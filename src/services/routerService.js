const pool = require('../config/database');

class RouterService {
  async findProviderByModel(userId, model) {
    const result = await pool.query(
      `SELECT p.* FROM providers p 
       JOIN api_keys ak ON p.user_id = ak.user_id 
       WHERE p.user_id = $1 AND p.enabled = true
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async findBestProvider(userId, model) {
    const providers = await this.findProviderByModel(userId, model);
    
    if (providers.length === 0) {
      throw new Error('No enabled providers found');
    }

    const healthyProviders = providers.filter(p => !p.last_failed_at || 
      new Date(p.last_failed_at) < new Date(Date.now() - 60000));

    if (healthyProviders.length === 0) {
      return providers[0];
    }

    return healthyProviders[0];
  }

  async recordProviderStatus(providerId, success, latency) {
    await pool.query(
      `UPDATE providers 
       SET last_success_at = CASE WHEN $2 THEN NOW() ELSE last_success_at END,
           last_failed_at = CASE WHEN NOT $2 THEN NOW() ELSE last_failed_at END,
           avg_latency = CASE WHEN $2 THEN COALESCE((avg_latency * 9 + $3) / 10, $3) ELSE avg_latency END
       WHERE id = $1`,
      [providerId, success, latency]
    );
  }
}

module.exports = new RouterService();