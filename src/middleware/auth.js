const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [user.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  });
};

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const result = await pool.query(
    'SELECT ak.*, u.id as user_id FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak.key_value = $1 AND ak.enabled = true',
    [apiKey]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid or disabled API key' });
  }

  req.apiKey = result.rows[0];
  next();
};

module.exports = { authenticateToken, authenticateApiKey };