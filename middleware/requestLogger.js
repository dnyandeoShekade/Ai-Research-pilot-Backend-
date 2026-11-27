const logger = require("../utils/logger");

const metrics = {
  totalRequests: 0,
  agentQueries: 0,
  documentUploads: 0,
  errors: 0,
  latencies: [],
  getAverageLatency() {
    if (this.latencies.length === 0) return 0;
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencies.length);
  },
};

function requestLogger(req, res, next) {
  const start = Date.now();
  metrics.totalRequests++;

  if (req.originalUrl.includes("/api/agent")) {
    metrics.agentQueries++;
  } else if (req.originalUrl.includes("/api/documents/upload")) {
    metrics.documentUploads++;
  }

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Keep rolling window of last 100 latencies
    if (metrics.latencies.length > 100) metrics.latencies.shift();
    metrics.latencies.push(duration);

    if (res.statusCode >= 400) {
      metrics.errors++;
      logger.warn(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    } else {
      logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
}

module.exports = { requestLogger, metrics };
