const { createClient } = require('@libsql/client/http');

let client = null;

const classifyError = (error) => {
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  if (msg.includes('timeout') || msg.includes('etimedout') || code === 'ETIMEDOUT' || code === 'ABORT_ERR') return 'Timeout';
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('auth') || msg.includes('forbidden')) return 'AuthFailed';
  if (msg.includes('enotfound') || msg.includes('dns') || msg.includes('getaddrinfo') || code === 'ENOTFOUND') return 'DNSResolution';
  if (msg.includes('econnrefused') || msg.includes('connection') || msg.includes('unable to open') || code === 'ECONNREFUSED') return 'ConnectionRefused';
  if (msg.includes('cert') || msg.includes('ssl') || msg.includes('tls') || msg.includes('self signed')) return 'TLS';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('abort')) return 'NetworkError';
  if (msg.includes('parse') || msg.includes('syntax') || msg.includes('json')) return 'ParseError';
  if (msg.includes('rate') || msg.includes('too many')) return 'RateLimited';
  return 'UnknownError';
};

const getClient = () => {
  if (!client) {
    const url = process.env.LIBSQL_URL || 'file:./local.db';
    const authToken = process.env.LIBSQL_AUTH_TOKEN || undefined;

    const config = { url, authToken, concurrency: 3 };

    if (!url.startsWith('file:')) {
      const timeout = parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 10000;
      config.fetch = (input, init) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
      };
    }

    client = createClient(config);
  }
  return client;
};

module.exports = { getClient, classifyError };
