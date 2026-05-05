require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/database');
const logger = require('./config/logger');

const authRoutes = require('./routes/auth');
const apiKeyRoutes = require('./routes/apiKeys');
const chatRoutes = require('./routes/chat');
const providerRoutes = require('./routes/providers');
const monitorRoutes = require('./routes/monitor');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/monitor', monitorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  logger.info('Client connected for monitoring');
  
  socket.on('subscribe', async (userId) => {
    socket.join(userId);
    logger.info(`Client subscribed to user ${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

const broadcastStats = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        ak.user_id,
        COUNT(*) as request_count,
        AVG(r.latency) as avg_latency,
        SUM(CASE WHEN r.status_code = 200 THEN 1 ELSE 0 END) as success_count
      FROM requests r
      JOIN api_keys ak ON r.api_key_id = ak.id
      WHERE r.created_at >= NOW() - INTERVAL '1 minute'
      GROUP BY ak.user_id
    `);

    result.rows.forEach(row => {
      io.to(row.user_id).emit('stats', {
        user_id: row.user_id,
        request_count: parseInt(row.request_count),
        avg_latency_ms: Math.round(parseFloat(row.avg_latency) || 0),
        success_count: parseInt(row.success_count),
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error('Error broadcasting stats:', error);
  }
};

setInterval(broadcastStats, 5000);

const PORT = process.env.PORT || 3000;

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        key_value VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(100),
        enabled BOOLEAN DEFAULT TRUE,
        rate_limit INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        provider_name VARCHAR(100) NOT NULL,
        provider_type VARCHAR(50) DEFAULT 'openai',
        api_key VARCHAR(255) NOT NULL,
        base_url VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
        provider VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        status_code INTEGER NOT NULL,
        latency INTEGER,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_requests_api_key_id ON requests(api_key_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id)`);

    logger.info('Database tables initialized');
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await initDatabase();
  
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API available at http://localhost:${PORT}`);
  });
};

startServer().catch(logger.error);