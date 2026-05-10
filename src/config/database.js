const { createClient } = require('@libsql/client');

const url = process.env.LIBSQL_URL || 'file:./local.db';
const authToken = process.env.LIBSQL_AUTH_TOKEN || undefined;

const client = createClient({
  url,
  authToken,
});

module.exports = client;
