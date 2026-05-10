const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..');
const dbPath = path.join(dataDir, 'local.db');
const db = new sqlite3.Database(dbPath);

module.exports = db;
