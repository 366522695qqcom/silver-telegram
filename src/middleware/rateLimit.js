const isVercel = !!process.env.VERCEL;

const noopLimiter = (req, res, next) => next();

let authLimiter = noopLimiter;
let apiLimiter = noopLimiter;
let createRateLimiter = () => noopLimiter;

if (!isVercel) {
  const rateLimit = require('express-rate-limit');

  createRateLimiter = (max, windowMs = 60 * 1000) => {
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Please try again later',
        });
      },
    });
  };

  authLimiter = createRateLimiter(100);
  apiLimiter = createRateLimiter(1000);
} else {
  const buckets = new Map();
  const MAX_TOKENS = 100;
  const WINDOW_MS = 15 * 60 * 1000;

  const vercelLimiter = (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(ip);

    if (!bucket || now - bucket.resetAt >= WINDOW_MS) {
      bucket = { tokens: MAX_TOKENS, resetAt: now };
      buckets.set(ip, bucket);
    }

    if (bucket.tokens <= 0) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
      });
    }

    bucket.tokens--;
    next();
  };

  authLimiter = vercelLimiter;
  apiLimiter = vercelLimiter;
  createRateLimiter = () => vercelLimiter;
}

module.exports = { authLimiter, apiLimiter, createRateLimiter };
