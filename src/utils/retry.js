const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryOnStatus: [429, 500, 502, 503, 504],
};

class RetryService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  async execute(fn, context) {
    let delay = this.config.initialDelay;
    let lastError = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn(context);
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;

        if (!this.config.retryOnStatus.includes(statusCode)) {
          throw error;
        }

        if (attempt < this.config.maxRetries) {
          await sleep(delay);
          delay = Math.min(delay * this.config.backoffMultiplier, this.config.maxDelay);
        }
      }
    }

    throw lastError;
  }
}

module.exports = RetryService;