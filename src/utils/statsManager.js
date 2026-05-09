let manager = null;

exports.setManager = (m) => {
  manager = m;
};

exports.updateStats = (statusCode, latency) => {
  if (manager && manager.updateStats) {
    manager.updateStats(statusCode, latency);
  }
};

exports.getStats = () => {
  if (manager && manager.getStats) {
    return manager.getStats();
  }
  return {
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    avgLatency: 0,
    activeConnections: 0,
  };
};
