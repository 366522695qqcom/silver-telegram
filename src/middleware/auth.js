const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

const authenticateToken = async (req, res, next) => {
  try {
    let token = req.headers['authorization']?.split(' ')[1];
    
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

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
  let apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.split(' ')[1];
    }
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const result = await query(
      'SELECT ak.id, ak.user_id, ak.name, ak."key", ak.enabled, ak.created_at, ak.expires_at, u.id as uid FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak."key" = ?',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or disabled API key' });
    }

    const apiKeyData = result.rows[0];

    if (!apiKeyData.enabled || Number(apiKeyData.enabled) !== 1) {
      return res.status(401).json({ error: 'API key is disabled' });
    }

    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    req.apiKey = apiKeyData;
    next();
  } catch (error) {
    console.error('authenticateApiKey error:', error.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
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
