const rateLimit = require('express-rate-limit');

const createRateLimiter = (max, windowMs = 60 * 1000) => {
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

const authLimiter = createRateLimiter(100);
const apiLimiter = createRateLimiter(1000);

module.exports = { authLimiter, apiLimiter, createRateLimiter };