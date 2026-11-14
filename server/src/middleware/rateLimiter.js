/**
 * Lightweight in-memory rate limiter middleware.
 * Tracks requests per IP address across a sliding time window.
 */
class MemoryRateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map();

    // Periodic cleanup of expired IP records
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of this.hits.entries()) {
        if (now - data.startTime > this.windowMs) {
          this.hits.delete(ip);
        }
      }
    }, windowMs);
    if (interval.unref) {
      interval.unref();
    }
  }

  middleware({ skipTestCheck = false } = {}) {
    return (req, res, next) => {
      // Bypass rate limiting in test environment unless explicitly testing rate limiter
      if (process.env.NODE_ENV === 'test' && !skipTestCheck) {
        return next();
      }

      const ip = req.ip || req.connection?.remoteAddress || 'unknown-ip';
      const now = Date.now();

      let clientData = this.hits.get(ip);
      if (!clientData || now - clientData.startTime > this.windowMs) {
        clientData = { count: 1, startTime: now };
        this.hits.set(ip, clientData);
      } else {
        clientData.count += 1;
      }

      const remaining = Math.max(0, this.maxRequests - clientData.count);
      const resetTime = Math.ceil((clientData.startTime + this.windowMs - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      if (clientData.count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests created from this IP, please try again after 15 minutes',
          errors: [
            {
              field: 'rate_limit',
              message: `Exceeded ${this.maxRequests} requests per ${this.windowMs / 60000} minutes`,
            },
          ],
        });
      }

      next();
    };
  }
}

export const rateLimiter = (windowMs, maxRequests, options = {}) =>
  new MemoryRateLimiter(windowMs, maxRequests).middleware(options);

export { MemoryRateLimiter };
export default rateLimiter;
