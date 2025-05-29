/**
 * express-api-throttle - Advanced Rate Limiting per Route/User/IP
 * A customizable rate-limiting middleware with per-user, per-IP, or per-route logic
 */

/**
 * In-memory storage for rate limiting
 */
class MemoryStore {
  constructor() {
    this.store = new Map();
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get current hit count for a key
   * @param {String} key - Unique identifier
   * @returns {Object} Hit count and reset time
   */
  async get(key) {
    if (!this.store.has(key)) {
      return null;
    }
    return this.store.get(key);
  }

  /**
   * Increment hit count for a key
   * @param {String} key - Unique identifier
   * @param {Number} windowMs - Time window in milliseconds
   * @returns {Object} Updated hit count and reset time
   */
  async increment(key, windowMs) {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    if (!this.store.has(key)) {
      const record = { hits: 1, resetTime };
      this.store.set(key, record);
      return record;
    }
    
    const record = this.store.get(key);
    
    // If the window has expired, reset the counter
    if (now > record.resetTime) {
      record.hits = 1;
      record.resetTime = resetTime;
    } else {
      record.hits += 1;
    }
    
    return record;
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis store for distributed rate limiting
 */
class RedisStore {
  constructor(redisClient) {
    this.client = redisClient;
  }

  /**
   * Get current hit count for a key
   * @param {String} key - Unique identifier
   * @returns {Object} Hit count and reset time
   */
  async get(key) {
    const data = await this.client.get(`throttle:${key}`);
    if (!data) return null;
    
    return JSON.parse(data);
  }

  /**
   * Increment hit count for a key
   * @param {String} key - Unique identifier
   * @param {Number} windowMs - Time window in milliseconds
   * @returns {Object} Updated hit count and reset time
   */
  async increment(key, windowMs) {
    const now = Date.now();
    const redisKey = `throttle:${key}`;
    
    const data = await this.client.get(redisKey);
    let record;
    
    if (!data) {
      record = { hits: 1, resetTime: now + windowMs };
    } else {
      record = JSON.parse(data);
      
      if (now > record.resetTime) {
        record = { hits: 1, resetTime: now + windowMs };
      } else {
        record.hits += 1;
      }
    }
    
    // Set with expiration
    const ttl = Math.ceil((record.resetTime - now) / 1000);
    await this.client.setEx(redisKey, ttl, JSON.stringify(record));
    
    return record;
  }
}

/**
 * Main throttle middleware factory
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function throttle(options = {}) {
  const defaults = {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    keyGenerator: (req) => req.ip,
    skip: () => false,
    store: new MemoryStore(),
    headers: true,
    handler: null,
    onLimitReached: null
  };

  const config = { ...defaults, ...options };

  return async function(req, res, next) {
    // Skip throttling if the condition is met
    if (config.skip(req, res)) {
      return next();
    }

    // Generate the key for this request
    const key = config.keyGenerator(req);
    
    try {
      // Increment the counter
      const record = await config.store.increment(key, config.windowMs);
      
      // Set headers
      if (config.headers) {
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - record.hits));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      }
      
      // If we've exceeded the limit
      if (record.hits > config.max) {
        if (config.onLimitReached) {
          config.onLimitReached(req, res);
        }
        
        if (config.headers) {
          res.setHeader('Retry-After', Math.ceil((record.resetTime - Date.now()) / 1000));
        }
        
        if (config.handler) {
          return config.handler(req, res, next);
        }
        
        return res.status(config.statusCode).json({
          success: false,
          message: config.message
        });
      }
      
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Export the main function and stores
throttle.MemoryStore = MemoryStore;
throttle.RedisStore = RedisStore;

module.exports = throttle;