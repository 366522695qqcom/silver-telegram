const winston = require('winston');

const isVercel = !!process.env.VERCEL;

const transports = [];

if (!isVercel) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  );
}

transports.push(new winston.transports.Console({
  format: isVercel ? winston.format.json() : winston.format.simple(),
}));

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports,
});

module.exports = logger;
