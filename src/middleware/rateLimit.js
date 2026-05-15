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
}

module.exports = { authLimiter, apiLimiter, createRateLimiter };