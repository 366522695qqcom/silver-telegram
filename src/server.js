require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { initializeDatabase } = require('./utils/db');

const authRoutes = require('./routes/auth');
const providersRoutes = require('./routes/providers');
const apiKeysRoutes = require('./routes/apiKeys');
const chatRoutes = require('./routes/chat');
const monitorRoutes = require('./routes/monitor');
const auditRoutes = require('./routes/audit');
const costRoutes = require('./routes/cost');
const routingRoutes = require('./routes/routing');
const batchRoutes = require('./routes/batch');
const toolsRoutes = require('./routes/tools');
const visionRoutes = require('./routes/vision');
const imagesRoutes = require('./routes/images');
const asyncRoutes = require('./routes/async');
const webhooksRoutes = require('./routes/webhooks');

const PORT = process.env.PORT || 3000;
const isVercel = !!process.env.VERCEL;

const app = express();

app.use((req, res, next) => {
  if (isVercel && req.url !== '/api' && !req.url.startsWith('/api/')) {
    req.url = '/api/' + req.url.replace(/^\//, '');
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

if (!isVercel) {
  const rateLimit = require('express-rate-limit');
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', apiLimiter);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let dbReady = false;
let dbInitError = null;
const dbInitPromise = initializeDatabase()
  .then(() => {
    dbReady = true;
    console.log('Database initialized successfully');
  })
  .catch(err => {
    dbInitError = err;
    console.error('Database initialization failed:', err.message || err);
  });

app.use(async (req, res, next) => {
  try {
    await dbInitPromise;
  } catch (e) {
    // already caught above
  }
  if (!dbReady) {
    console.warn('Request received but database is not initialized:', req.method, req.url);
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/async', asyncRoutes);
app.use('/api/webhooks', webhooksRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), db: dbReady ? 'connected' : 'error', vercel: isVercel });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.url });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
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
      await dbInitPromise;
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
