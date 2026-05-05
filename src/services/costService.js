const pool = require('../config/database');

const DEFAULT_PRICES = {
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
  'claude-3-opus': { prompt: 0.15, completion: 0.75 },
  'claude-3-sonnet': { prompt: 0.03, completion: 0.15 },
  'claude-3-haiku': { prompt: 0.0025, completion: 0.0125 },
};

class CostService {
  async getPrice(providerName, model) {
    const result = await pool.query(
      'SELECT prompt_price, completion_price FROM prices WHERE provider_name = $1 AND model = $2',
      [providerName, model]
    );

    if (result.rows.length > 0) {
      return {
        prompt: parseFloat(result.rows[0].prompt_price),
        completion: parseFloat(result.rows[0].completion_price),
      };
    }

    const modelLower = model.toLowerCase();
    for (const [key, price] of Object.entries(DEFAULT_PRICES)) {
      if (modelLower.includes(key)) {
        return price;
      }
    }

    return { prompt: 0.001, completion: 0.002 };
  }

  async calculateCost(providerName, model, promptTokens, completionTokens) {
    const price = await this.getPrice(providerName, model);
    return ((promptTokens * price.prompt) + (completionTokens * price.completion)) / 1000;
  }

  async recordCost(requestId, cost) {
    await pool.query(
      'UPDATE requests SET cost = $1 WHERE id = $2',
      [cost, requestId]
    );
  }

  async getMonthlyUsage(userId, month, year) {
    const result = await pool.query(
      `SELECT SUM(cost) as total_cost, COUNT(*) as total_requests,
              SUM(prompt_tokens) as total_prompt_tokens,
              SUM(completion_tokens) as total_completion_tokens
       FROM requests r
       JOIN api_keys ak ON r.api_key_id = ak.id
       WHERE ak.user_id = $1 
         AND EXTRACT(YEAR FROM r.created_at) = $2
         AND EXTRACT(MONTH FROM r.created_at) = $3`,
      [userId, year, month]
    );

    return {
      total_cost: parseFloat(result.rows[0].total_cost) || 0,
      total_requests: parseInt(result.rows[0].total_requests) || 0,
      total_prompt_tokens: parseInt(result.rows[0].total_prompt_tokens) || 0,
      total_completion_tokens: parseInt(result.rows[0].total_completion_tokens) || 0,
    };
  }

  async setPrice(userId, providerName, model, promptPrice, completionPrice) {
    const existing = await pool.query(
      'SELECT id FROM prices WHERE provider_name = $1 AND model = $2',
      [providerName, model]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE prices SET prompt_price = $1, completion_price = $2 WHERE id = $3',
        [promptPrice, completionPrice, existing.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO prices (provider_name, model, prompt_price, completion_price) VALUES ($1, $2, $3, $4)',
        [providerName, model, promptPrice, completionPrice]
      );
    }
  }
}

module.exports = new CostService();