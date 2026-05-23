const keyCounters = new Map();

const selectApiKey = (providerId, apiKeyField) => {
  if (!apiKeyField) return apiKeyField;
  const keys = apiKeyField.split(',').map(k => k.trim()).filter(k => k.length > 0);
  if (keys.length <= 1) return apiKeyField.trim();
  const counter = keyCounters.get(providerId) || 0;
  const selectedKey = keys[counter % keys.length];
  keyCounters.set(providerId, counter + 1);
  return selectedKey;
};

const getApiKeyCount = (apiKeyField) => {
  if (!apiKeyField) return 0;
  return apiKeyField.split(',').map(k => k.trim()).filter(k => k.length > 0).length;
};

const getFirstApiKey = (apiKeyField) => {
  if (!apiKeyField) return apiKeyField;
  const keys = apiKeyField.split(',').map(k => k.trim()).filter(k => k.length > 0);
  return keys[0] || apiKeyField;
};

const resetCounters = () => {
  keyCounters.clear();
};

module.exports = { selectApiKey, getApiKeyCount, getFirstApiKey, resetCounters };
