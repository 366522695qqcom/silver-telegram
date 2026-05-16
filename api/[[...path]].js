let app;
let initError;

try {
  app = require('../src/server');
} catch (error) {
  initError = error;
  console.error('Server init failed:', error.message);
}

module.exports = (req, res) => {
  if (initError) {
    res.status(500).json({
      error: 'Service temporarily unavailable',
    });
    return;
  }
  app(req, res);
};