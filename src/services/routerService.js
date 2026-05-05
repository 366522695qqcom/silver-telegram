const { query, run } = require('../utils/db');

class RouterService {
  async findProviderByModel(userId, model) {
    const result = await query(
      'SELECT p.* FROM providers p JOIN api_keys ak ON p.user_id = ak.user_id WHERE p.user_id = ? AND p.enabled = 1 ORDER BY p.created_at DESC',
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
    if (success) {
      await run(
        'UPDATE providers SET last_success_at = CURRENT_TIMESTAMP, avg_latency = COALESCE((avg_latency * 9 + ?) / 10, ?) WHERE id = ?',
        [latency, latency, providerId]
      );
    } else {
      await run(
        'UPDATE providers SET last_failed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [providerId]
      );
    }
  }
}

module.exports = new RouterService();
