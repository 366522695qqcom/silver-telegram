const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
});

class CacheService {
  get(key) {
    return cache.get(key);
  }

  set(key, value, ttl = 3600) {
    return cache.set(key, value, ttl);
  }

  delete(key) {
    return cache.del(key);
  }

  clear() {
    return cache.flushAll();
  }

  getStats() {
    return cache.getStats();
  }

  generateCacheKey(requestData) {
    const { model, messages, max_tokens, temperature } = requestData;
    const messagesStr = JSON.stringify(messages);
    return `${model}_${max_tokens}_${temperature}_${messagesStr}`;
  }
}

module.exports = new CacheService();