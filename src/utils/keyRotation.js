const keyCounters = new Map();
const parsedKeysCache = new Map();

const parseKeys = (apiKeyField) => {
  if (parsedKeysCache.has(apiKeyField)) {
    return parsedKeysCache.get(apiKeyField);
  }
  let keys;
  try {
    const parsed = JSON.parse(apiKeyField);
    if (Array.isArray(parsed)) {
      keys = parsed.map(k => String(k).trim()).filter(k => k.length > 0);
    } else {
      keys = apiKeyField.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
  } catch {
    keys = apiKeyField.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }
  parsedKeysCache.set(apiKeyField, keys);
  return keys;
};

const selectApiKey = (providerId, apiKeyField) => {
  if (!apiKeyField) return apiKeyField;
  const keys = parseKeys(apiKeyField);
  if (keys.length <= 1) return apiKeyField.trim();
  const counter = keyCounters.get(providerId) || 0;
  const selectedKey = keys[counter % keys.length];
  keyCounters.set(providerId, counter + 1);
  return selectedKey;
};

const getApiKeyCount = (apiKeyField) => {
  if (!apiKeyField) return 0;
  return parseKeys(apiKeyField).length;
};

const getFirstApiKey = (apiKeyField) => {
  if (!apiKeyField) return apiKeyField;
  const keys = parseKeys(apiKeyField);
  return keys[0] || apiKeyField;
};

const resetCounters = () => {
  keyCounters.clear();
  parsedKeysCache.clear();
};

module.exports = { selectApiKey, getApiKeyCount, getFirstApiKey, resetCounters };
