require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { initializeDatabase, query, run } = require('./utils/db');

const authRoutes = require('./routes/auth');
const providersRoutes = require('./routes/providers');
const apiKeysRoutes = require('./routes/apiKeys');
const chatRoutes = require('./routes/chat');
const monitorRoutes = require('./routes/monitor');
const auditRoutes = require('./routes/audit');
const costRoutes = require('./routes/cost');
const imagesRoutes = require('./routes/images');
const customModelsRoutes = require('./routes/customModels');
const webhooksRoutes = require('./routes/webhooks');

const PORT = process.env.PORT || 3000;
const isVercel = !!process.env.VERCEL;

const app = express();

app.use((req, res, next) => {
  if (isVercel && req.query.__path) {
    req.url = '/api/' + req.query.__path;
    delete req.query.__path;
  }
  next();
});

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

if (isVercel) {
  const tokenBuckets = new Map();
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
  const RATE_LIMIT_MAX = 100;

  app.use('/api/', (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    const now = Date.now();

    let bucket = tokenBuckets.get(ip);
    if (!bucket || now - bucket.lastReset > RATE_LIMIT_WINDOW) {
      bucket = { tokens: RATE_LIMIT_MAX, lastReset: now };
      tokenBuckets.set(ip, bucket);
    }

    if (bucket.tokens <= 0) {
      return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }

    bucket.tokens--;
    next();
  });

  setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of tokenBuckets) {
      if (now - bucket.lastReset > RATE_LIMIT_WINDOW) {
        tokenBuckets.delete(ip);
      }
    }
  }, RATE_LIMIT_WINDOW);
} else {
  const rateLimit = require('express-rate-limit');
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', apiLimiter);
}

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let dbReady = false;
let dbInitError = null;
let dbErrorType = null;
let dbInitPromise = null;

const startDbInit = () => {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = initializeDatabase()
    .then(() => {
      dbReady = true;
      console.log('Database initialized successfully');
    })
    .catch(err => {
      dbInitError = err;
      const { classifyError } = require('./config/database');
      dbErrorType = classifyError(err);
      console.error('Database initialization failed:', dbErrorType, '-', (err.message || err).substring(0, 200));
    });
  return dbInitPromise;
};

app.get('/api/debug-keys', async (req, res) => {
  try {
    const [keys, reqCount, sampleReqs] = await Promise.all([
      query('SELECT id, name, enabled FROM api_keys LIMIT 10'),
      query('SELECT COUNT(*) as count FROM requests'),
      query('SELECT id, provider, model, status_code, latency, created_at FROM requests ORDER BY created_at DESC LIMIT 5'),
    ]);
    res.json({
      apiKeys: keys.rows.map(r => ({
        id: r.id?.substring(0, 8),
        name: r.name,
        enabled: r.enabled,
        enabledType: typeof r.enabled,
      })),
      totalRequests: reqCount.rows[0]?.count,
      sampleRequests: sampleReqs.rows,
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get('/api/debug-stats', async (req, res) => {
  try {
    startDbInit();
    await Promise.race([
      dbInitPromise,
      new Promise(r => setTimeout(r, 5000))
    ]);

    const [reqCount, sampleReqs, keyCount, providerCount, userCount, todayCount] = await Promise.all([
      query('SELECT COUNT(*) as count FROM requests'),
      query('SELECT id, api_key_id, provider, model, status_code, latency, error_message, created_at FROM requests ORDER BY created_at DESC LIMIT 10'),
      query('SELECT COUNT(*) as count FROM api_keys'),
      query('SELECT COUNT(*) as count FROM providers'),
      query('SELECT COUNT(*) as count FROM users'),
      query("SELECT COUNT(*) as count FROM requests WHERE created_at >= datetime('now', '-8 hours', 'start of day', '+8 hours')"),
    ]);

    res.json({
      dbStatus: dbReady ? 'connected' : 'error',
      dbError: dbReady ? null : dbErrorType,
      requestCount: Number(reqCount.rows[0]?.count) || 0,
      todayRequestCount: Number(todayCount.rows[0]?.count) || 0,
      apiKeyCount: Number(keyCount.rows[0]?.count) || 0,
      providerCount: Number(providerCount.rows[0]?.count) || 0,
      userCount: Number(userCount.rows[0]?.count) || 0,
      sampleRequests: sampleReqs.rows.slice(0, 5),
    });
  } catch (e) {
    res.json({ error: e.message, dbStatus: dbReady ? 'connected' : 'error' });
  }
});

app.post('/api/test-request', async (req, res) => {
  try {
    startDbInit();
    await Promise.race([
      dbInitPromise,
      new Promise(r => setTimeout(r, 5000))
    ]);
    if (!dbReady) {
      return res.status(500).json({ error: 'Database not ready', dbStatus: dbErrorType });
    }

    const { authenticateToken } = require('./middleware/auth');
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Login token required' });
    }

    const jwt = require('jsonwebtoken');
    let userId;
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const apiKeyResult = await query('SELECT id FROM api_keys WHERE user_id = ? LIMIT 1', [userId]);
    if (apiKeyResult.rows.length === 0) {
      return res.status(400).json({ error: 'No API key found. Please create an API key first.' });
    }
    const apiKeyId = apiKeyResult.rows[0].id;

    const { model } = req.body || {};
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    if (model) {
      const providerService = require('./services/providerService');
      const routerService = require('./services/routerService');
      const { selectApiKey } = require('./utils/keyRotation');
      const costService = require('./services/costService');

      let provider;
      try {
        provider = await routerService.findBestProvider(userId, model);
      } catch (err) {
        return res.status(400).json({ error: err.message || 'No enabled providers found for this model.' });
      }

      const startTime = Date.now();
      const result = await providerService.chatCompletion(
        {
          base_url: provider.base_url,
          api_key: selectApiKey(provider.id, provider.api_key),
          provider_type: provider.provider_type,
        },
        {
          model,
          messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
          max_tokens: 10,
          temperature: 0,
          stream: false,
        }
      );
      const latency = Date.now() - startTime;

      if (result.success) {
        const promptTokens = result.data.usage?.prompt_tokens || 0;
        const completionTokens = result.data.usage?.completion_tokens || 0;
        const cost = await costService.calculateCost(provider.provider_name, model, promptTokens, completionTokens);

        await run(
          'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, apiKeyId, provider.provider_name, model, 200, latency, promptTokens, completionTokens, cost]
        );

        res.json({
          success: true,
          message: 'Real AI API test request completed',
          request: { id: id.substring(0, 8), provider: provider.provider_name, model, status_code: 200, latency, prompt_tokens: promptTokens, completion_tokens: completionTokens, cost: Number(cost) || 0 },
        });
      } else {
        await run(
          'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, apiKeyId, provider.provider_name, model, result.status_code || 500, latency, result.error]
        );

        res.json({
          success: false,
          message: `AI API test failed: ${result.error}`,
          request: { id: id.substring(0, 8), provider: provider.provider_name, model, status_code: result.status_code || 500, latency, error: result.error },
        });
      }
    } else {
      const providers = ['openai', 'anthropic', 'google'];
      const models = ['gpt-4', 'claude-3-sonnet', 'gemini-pro'];
      const idx = Math.floor(Math.random() * 3);
      const provider = providers[idx];
      const fakeModel = models[idx];
      const latency = Math.floor(Math.random() * 2000) + 100;
      const statusCode = Math.random() > 0.1 ? 200 : 429;
      const promptTokens = Math.floor(Math.random() * 500) + 50;
      const completionTokens = Math.floor(Math.random() * 500) + 50;
      const cost = (promptTokens * 0.00003 + completionTokens * 0.00006).toFixed(6);

      await run(
        'INSERT INTO requests (id, api_key_id, provider, model, status_code, latency, prompt_tokens, completion_tokens, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, apiKeyId, provider, fakeModel, statusCode, latency, promptTokens, completionTokens, cost]
      );

      res.json({
        success: true,
        message: 'Simulated test request recorded',
        cost: Number(cost),
        request: { id: id.substring(0, 8), provider, model: fakeModel, status_code: statusCode, latency, prompt_tokens: promptTokens, completion_tokens: completionTokens, cost: Number(cost) },
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ping', async (req, res) => {
  const start = Date.now();
  const token = process.env.LIBSQL_AUTH_TOKEN || '';
  const libsqlUrl = process.env.LIBSQL_URL || '';
  try {
    const baseUrl = libsqlUrl.replace('libsql://', 'https://').replace(/\/$/, '');
    const pipelineUrl = `${baseUrl}/v2/pipeline`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: 'SELECT 1' } }] }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await resp.json();
    res.json({ ok: true, latency: Date.now() - start, status: resp.status, hasToken: !!token, tokenLen: token.length, urlLen: libsqlUrl.length, rows: data?.results?.[0]?.response?.result?.rows?.length });
  } catch (e) {
    res.json({ ok: false, latency: Date.now() - start, error: e.message?.substring(0, 150), name: e.name, hasToken: !!token });
  }
});

app.use(async (req, res, next) => {
  startDbInit();
  if (!dbReady && !dbInitError) {
    console.warn('Request received but database is not initialized:', req.method, req.url);
  }
  next();
});

app.get('/api/health', async (req, res) => {
  if (!dbReady && !dbInitError) {
    await Promise.race([
      startDbInit(),
      new Promise(r => setTimeout(r, 5000))
    ]);
  }
  res.json({ status: 'ok', timestamp: Date.now(), db: dbReady ? 'connected' : 'error', dbError: dbReady ? null : dbErrorType, vercel: isVercel });
});

app.use('/api/auth', authRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/custom-models', customModelsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.url });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large' });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

if (!isVercel) {
  const http = require('http');
  const { Server } = require('socket.io');

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean),
      credentials: true,
    },
  });

  let requestStats = {
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    avgLatency: 0,
    activeConnections: 0,
  };

  io.on('connection', (socket) => {
    requestStats.activeConnections++;
    socket.emit('stats', requestStats);
    socket.on('disconnect', () => {
      requestStats.activeConnections--;
    });
  });

  const updateStats = (statusCode, latency) => {
    requestStats.totalRequests++;
    if (statusCode >= 200 && statusCode < 400) {
      requestStats.successCount++;
    } else {
      requestStats.errorCount++;
    }
    requestStats.avgLatency = Math.round(
      (requestStats.avgLatency * (requestStats.totalRequests - 1) + latency) / requestStats.totalRequests
    );
    io.emit('stats', requestStats);
  };

  const getStats = () => requestStats;
  const statsManager = { updateStats, getStats };

  const setStatsManager = (manager) => {
    const target = require('./utils/statsManager');
    if (target.setManager) {
      target.setManager(manager);
    }
  };

  const startServer = async () => {
    try {
      await startDbInit();
      if (dbInitError) {
        console.error('Cannot start server: database initialization failed');
        process.exit(1);
      }
      setStatsManager(statsManager);
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = app;
