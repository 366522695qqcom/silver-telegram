const { createClient } = require('@libsql/client');

let client = null;

const getClient = () => {
  if (!client) {
    const url = process.env.LIBSQL_URL || 'file:./local.db';
    const authToken = process.env.LIBSQL_AUTH_TOKEN || undefined;
    client = createClient({ url, authToken });
  }
  return client;
};

module.exports = { getClient };
