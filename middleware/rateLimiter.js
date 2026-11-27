/**
 * In-memory sliding-window rate limiter for LLM endpoints.
 * Protects downstream AI providers from quota exhaustion and accidental loops.
 */
function createRateLimiter({ windowMs = 60 * 1000, maxRequests = 30, message = "Rate limit exceeded. Please wait a moment." } = {}) {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "global";
    const now = Date.now();

    const clientRequests = requests.get(ip) || [];
    // Filter out requests outside the time window
    const validRequests = clientRequests.filter((timestamp) => now - timestamp < windowMs);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterMs: windowMs - (now - validRequests[0]),
      });
    }

    validRequests.push(now);
    requests.set(ip, validRequests);

    // Garbage collect stale IPs periodically
    if (requests.size > 2000) {
      for (const [key, timestamps] of requests.entries()) {
        if (timestamps.every((t) => now - t > windowMs)) {
          requests.delete(key);
        }
      }
    }

    next();
  };
}

module.exports = { createRateLimiter };
