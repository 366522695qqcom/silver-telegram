const { query, run } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

class RoutingService {
  static async getRules(userId) {
    const result = await query('SELECT * FROM routing_rules WHERE user_id = ?', [userId]);
    return result.rows.map(row => ({
      ...row,
      provider_priority: row.provider_priority ? JSON.parse(row.provider_priority) : null
    }));
  }

  static async getRuleById(userId, ruleId) {
    const result = await query('SELECT * FROM routing_rules WHERE id = ? AND user_id = ?', [ruleId, userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      ...result.rows[0],
      provider_priority: result.rows[0].provider_priority ? JSON.parse(result.rows[0].provider_priority) : null
    };
  }

  static async createRule(userId, ruleData) {
    const id = uuidv4();
    await run(
      'INSERT INTO routing_rules (id, user_id, name, strategy, model_filter, provider_priority, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        userId,
        ruleData.name,
        ruleData.strategy,
        ruleData.model_filter || null,
        ruleData.provider_priority ? JSON.stringify(ruleData.provider_priority) : null,
        ruleData.enabled !== false ? 1 : 0
      ]
    );
    return this.getRuleById(userId, id);
  }

  static async updateRule(userId, ruleId, ruleData) {
    await run(
      'UPDATE routing_rules SET name = ?, strategy = ?, model_filter = ?, provider_priority = ?, enabled = ? WHERE id = ? AND user_id = ?',
      [
        ruleData.name,
        ruleData.strategy,
        ruleData.model_filter || null,
        ruleData.provider_priority ? JSON.stringify(ruleData.provider_priority) : null,
        ruleData.enabled !== false ? 1 : 0,
        ruleId,
        userId
      ]
    );
    return this.getRuleById(userId, ruleId);
  }

  static async deleteRule(userId, ruleId) {
    await run('DELETE FROM routing_rules WHERE id = ? AND user_id = ?', [ruleId, userId]);
  }

  static async selectProvider(userId, model, providers) {
    const enabledProviders = providers.filter(p => p.enabled);
    if (enabledProviders.length === 0) {
      return null;
    }

    const rules = await this.getRules(userId);
    const applicableRule = rules.find(r => {
      if (!r.enabled) return false;
      if (r.model_filter) {
        return model.includes(r.model_filter);
      }
      return true;
    });

    if (applicableRule) {
      return this.applyStrategy(applicableRule, enabledProviders);
    }

    return this.applyDefaultStrategy(enabledProviders);
  }

  static applyStrategy(rule, providers) {
    switch (rule.strategy) {
      case 'latency':
        return providers.sort((a, b) => (a.avg_latency || Infinity) - (b.avg_latency || Infinity))[0];
      case 'availability':
        return providers.sort((a, b) => {
          const aRecency = a.last_success_at ? Date.now() - new Date(a.last_success_at) : Infinity;
          const bRecency = b.last_success_at ? Date.now() - new Date(b.last_success_at) : Infinity;
          return aRecency - bRecency;
        })[0];
      case 'priority':
        if (rule.provider_priority && Array.isArray(rule.provider_priority)) {
          for (const providerName of rule.provider_priority) {
            const provider = providers.find(p => p.provider_name === providerName);
            if (provider) return provider;
          }
        }
        return providers[0];
      default:
        return providers[0];
    }
  }

  static applyDefaultStrategy(providers) {
    return providers.sort((a, b) => (a.avg_latency || Infinity) - (b.avg_latency || Infinity))[0];
  }

  static async healthCheck(userId, provider) {
    const providerService = require('./providerService');
    try {
      await providerService.testConnection(provider);
      await run(
        'UPDATE providers SET last_success_at = CURRENT_TIMESTAMP WHERE id = ?',
        [provider.id]
      );
      return { success: true };
    } catch (error) {
      await run(
        'UPDATE providers SET last_failed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [provider.id]
      );
      return { success: false, error: error.message };
    }
  }

  static async runHealthChecks(userId, providers) {
    const results = [];
    for (const provider of providers) {
      const result = await this.healthCheck(userId, provider);
      results.push({
        provider_id: provider.id,
        provider_name: provider.provider_name,
        ...result
      });
    }
    return results;
  }
}

module.exports = RoutingService;
