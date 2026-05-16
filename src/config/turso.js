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

const toTursoValue = (val) => {
  if (val === null || val === undefined) {
    return { type: 'null' };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { type: 'integer', value: String(val) };
    }
    return { type: 'float', value: val };
  }
  if (typeof val === 'string') {
    return { type: 'text', value: val };
  }
  if (Buffer.isBuffer(val)) {
    return { type: 'blob', base64: val.toString('base64') };
  }
  return { type: 'text', value: String(val) };
};

const extractTursoValue = (val) => {
  if (!val || val.type === 'null') return null;
  if (val.type === 'blob') return Buffer.from(val.base64 || '', 'base64');
  return val.value ?? null;
};

const convertTursoRows = (cols, rows) => {
  if (!cols || !rows) return rows || [];
  const colNames = cols.map(c => c.name);
  return rows.map(row =>
    Object.fromEntries(colNames.map((name, i) => [name, extractTursoValue(row[i])]))
  );
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

  const timeout = parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const tursoArgs = params.map(toTursoValue);
    const response = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql, args: tursoArgs } },
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
      const r = result.response?.result || {};
      if (r.cols !== undefined || r.rows !== undefined) {
        return {
          rows: convertTursoRows(r.cols, r.rows),
          rowsAffected: r.affected_row_count || 0,
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