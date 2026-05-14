let app;
let initError;

try {
  app = require('../src/server');
} catch (error) {
  initError = error;
  console.error('Server init failed:', error.message);
}

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (initError) {
    res.status(500).json({
      error: 'Server initialization failed',
      message: initError.message,
      stack: initError.stack?.split('\n').slice(0, 5),
    });
    return;
  }

  app(req, res);
};
