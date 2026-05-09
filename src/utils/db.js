const db = require('../config/database');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider_name TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        api_key TEXT NOT NULL,
        base_url TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        avg_latency REAL DEFAULT 0,
        last_success_at TIMESTAMP,
        last_failed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        key TEXT UNIQUE NOT NULL,
        name TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        api_key_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        status_code INTEGER,
        latency INTEGER,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        cost REAL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS user_quotas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        daily_requests INTEGER DEFAULT 1000,
        monthly_cost_limit REAL DEFAULT 100.0,
        total_tokens_limit INTEGER DEFAULT 1000000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_name TEXT NOT NULL,
        model TEXT NOT NULL,
        prompt_price REAL NOT NULL,
        completion_price REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS routing_rules (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        strategy TEXT NOT NULL,
        model_filter TEXT,
        provider_priority TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS batch_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        api_key_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requests TEXT NOT NULL,
        results TEXT,
        strategy TEXT DEFAULT 'parallel',
        timeout INTEGER DEFAULT 300,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
      )`,
      `CREATE TABLE IF NOT EXISTS tools (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        schema TEXT NOT NULL,
        endpoint TEXT,
        auth_config TEXT,
        enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS async_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payload TEXT NOT NULL,
        result TEXT,
        webhook_url TEXT,
        webhook_secret TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    ];

    const executeStatements = (index) => {
      if (index >= statements.length) {
        resolve();
        return;
      }
      
      db.run(statements[index], (err) => {
        if (err) {
          reject(err);
        } else {
          executeStatements(index + 1);
        }
      });
    };

    executeStatements(0);
  });
};

module.exports = { query, run, initializeDatabase };
