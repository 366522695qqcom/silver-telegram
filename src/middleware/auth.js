const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const user = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });

    const result = await query('SELECT id, email, name FROM users WHERE id = ?', [user.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const result = await query(
    'SELECT ak.*, u.id as user_id FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak.key = ? AND ak.enabled = 1',
    [apiKey]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid or disabled API key' });
  }

  const apiKeyData = result.rows[0];

  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    return res.status(401).json({ error: 'API key has expired' });
  }

  req.apiKey = apiKeyData;
  next();
};

const checkApiKeyPermissions = (model, provider) => {
  return async (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    next();
  };
};

module.exports = { authenticateToken, authenticateApiKey, checkApiKeyPermissions };
