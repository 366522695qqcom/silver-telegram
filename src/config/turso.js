const { classifyError } = require('./database');

const TURSO_PIPELINE = '/v2/pipeline';

let client = null;

const getTursoClient = () => {
  if (client) return client;
  const url = process.env.LIBSQL_URL || 'file:./local.db';
  const authToken = process.env.LIBSQL_AUTH_TOKEN || '';
  client = { url, authToken };
  return client;
};

const resetClient = () => {
  client = null;
};

const executeTurso = async (sql, params = []) => {
  const { url, authToken } = getTursoClient();
  if (!url || url.startsWith('file:')) {
    const { getClient } = require('./database');
    const db = getClient();
    const result = await db.execute({ sql, args: params });
    return { rows: result.rows, rowsAffected: result.rowsAffected || 0 };
  }

  const baseUrl = url.replace(/\/$/, '');
  const pipelineUrl = `${baseUrl}${TURSO_PIPELINE}`;

  const timeout = parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql, args: params } },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Turso HTTP ${response.status}: ${text.substring(0, 200)}`);
    }

    const data = await response.json();
    if (data.results && data.results[0]) {
      const result = data.results[0];
      if (result.type === 'error') {
        throw new Error(`Turso error: ${result.error?.message || 'unknown'}`);
      }
      if (result.type === 'execute') {
        return {
          rows: result.response?.result?.rows || [],
          rowsAffected: result.response?.result?.rowsAffected || 0,
        };
      }
    }
    return { rows: [], rowsAffected: 0 };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Turso connection timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { executeTurso, getTursoClient, resetClient, classifyError };