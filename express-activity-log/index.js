/**
 * express-activity-log - Middleware for Logging User Activity
 * Tracks and logs user actions like route access, data changes, or failed attempts
 */

const fs = require('fs');
const path = require('path');

/**
 * File storage adapter
 */
class FileStorage {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.filename = options.filename || 'activity.log';
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    // Create log directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Save activity log
   * @param {Object} activity - Activity data
   * @returns {Promise} Promise that resolves when log is saved
   */
  async save(activity) {
    const logPath = path.join(this.logDir, this.filename);
    
    // Check if log file needs rotation
    try {
      const stats = fs.existsSync(logPath) ? fs.statSync(logPath) : { size: 0 };
      
      if (stats.size > this.maxSize) {
        await this.rotateLog();
      }
    } catch (err) {
      console.error('Error checking log file size:', err);
    }
    
    // Format activity as JSON string with timestamp
    const logEntry = JSON.stringify({
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString()
    }) + '\n';
    
    // Append to log file
    return new Promise((resolve, reject) => {
      fs.appendFile(logPath, logEntry, 'utf8', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Rotate log files
   * @returns {Promise} Promise that resolves when rotation is complete
   */
  async rotateLog() {
    const logPath = path.join(this.logDir, this.filename);
    
    // Shift existing log files
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldPath = path.join(this.logDir, `${this.filename}.${i}`);
      const newPath = path.join(this.logDir, `${this.filename}.${i + 1}`);
      
      if (fs.existsSync(oldPath)) {
        try {
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }
          fs.renameSync(oldPath, newPath);
        } catch (err) {
          console.error(`Error rotating log file ${oldPath}:`, err);
        }
      }
    }
    
    // Rename current log file
    if (fs.existsSync(logPath)) {
      const newPath = path.join(this.logDir, `${this.filename}.1`);
      try {
        if (fs.existsSync(newPath)) {
          fs.unlinkSync(newPath);
        }
        fs.renameSync(logPath, newPath);
      } catch (err) {
        console.error('Error rotating current log file:', err);
      }
    }
    
    return Promise.resolve();
  }
}

/**
 * Console storage adapter
 */
class ConsoleStorage {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
  }

  /**
   * Save activity log to console
   * @param {Object} activity - Activity data
   * @returns {Promise} Promise that resolves when log is saved
   */
  async save(activity) {
    const logMethod = console[this.logLevel] || console.log;
    logMethod('[Activity Log]', JSON.stringify(activity, null, 2));
    return Promise.resolve();
  }
}

/**
 * Memory storage adapter (for testing)
 */
class MemoryStorage {
  constructor() {
    this.logs = [];
  }

  /**
   * Save activity log to memory
   * @param {Object} activity - Activity data
   * @returns {Promise} Promise that resolves when log is saved
   */
  async save(activity) {
    this.logs.push({
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString()
    });
    return Promise.resolve();
  }

  /**
   * Get all logs
   * @returns {Array} Array of log entries
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }
}

/**
 * Main activity logger middleware factory
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function activityLog(options = {}) {
  const defaults = {
    storage: 'file',
    storageOptions: {},
    exclude: [],
    include: null, // null means include all routes
    logBody: true,
    logQuery: true,
    logParams: true,
    sensitiveFields: ['password', 'token', 'secret', 'authorization'],
    getUserInfo: (req) => {
      return {
        id: req.user ? req.user.id : null,
        username: req.user ? req.user.username : null
      };
    },
    getActivityType: (req) => {
      const method = req.method.toLowerCase();
      switch (method) {
        case 'get': return 'read';
        case 'post': return 'create';
        case 'put':
        case 'patch': return 'update';
        case 'delete': return 'delete';
        default: return method;
      }
    },
    customData: null
  };

  const config = { ...defaults, ...options };
  
  // Create storage adapter
  let storage;
  switch (config.storage) {
    case 'file':
      storage = new FileStorage(config.storageOptions);
      break;
    case 'console':
      storage = new ConsoleStorage(config.storageOptions);
      break;
    case 'memory':
      storage = new MemoryStorage();
      break;
    case 'custom':
      if (!config.storageOptions.adapter || typeof config.storageOptions.adapter.save !== 'function') {
        throw new Error('Custom storage adapter must implement save() method');
      }
      storage = config.storageOptions.adapter;
      break;
    default:
      throw new Error(`Unsupported storage type: ${config.storage}`);
  }

  // Create middleware function
  return function(req, res, next) {
    // Check if route should be logged
    const shouldLog = () => {
      const path = req.originalUrl || req.url;
      
      // Check exclusions
      if (Array.isArray(config.exclude)) {
        for (const pattern of config.exclude) {
          if (typeof pattern === 'string' && path.includes(pattern)) {
            return false;
          }
          if (pattern instanceof RegExp && pattern.test(path)) {
            return false;
          }
        }
      }
      
      // Check inclusions
      if (Array.isArray(config.include)) {
        for (const pattern of config.include) {
          if (typeof pattern === 'string' && path.includes(pattern)) {
            return true;
          }
          if (pattern instanceof RegExp && pattern.test(path)) {
            return true;
          }
        }
        return false;
      }
      
      return true;
    };
    
    // Skip logging if route is excluded
    if (!shouldLog()) {
      return next();
    }
    
    // Sanitize object by removing sensitive fields
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result = { ...obj };
      
      for (const field of config.sensitiveFields) {
        if (field in result) {
          result[field] = '***REDACTED***';
        }
      }
      
      return result;
    };
    
    // Capture request start time
    const startTime = Date.now();
    
    // Prepare activity data
    const activity = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      type: config.getActivityType(req),
      user: config.getUserInfo(req)
    };
    
    // Add request data
    if (config.logParams && Object.keys(req.params).length > 0) {
      activity.params = sanitize(req.params);
    }
    
    if (config.logQuery && Object.keys(req.query).length > 0) {
      activity.query = sanitize(req.query);
    }
    
    if (config.logBody && req.body && Object.keys(req.body).length > 0) {
      activity.body = sanitize(req.body);
    }
    
    // Add custom data if provided
    if (typeof config.customData === 'function') {
      const customData = config.customData(req);
      if (customData && typeof customData === 'object') {
        activity.custom = customData;
      }
    }
    
    // Capture response data
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    // Override response methods to capture status code
    res.send = function(body) {
      activity.statusCode = res.statusCode;
      activity.responseTime = Date.now() - startTime;
      
      // Log activity
      storage.save(activity).catch(err => {
        console.error('Error saving activity log:', err);
      });
      
      return originalSend.apply(this, arguments);
    };
    
    res.json = function(body) {
      activity.statusCode = res.statusCode;
      activity.responseTime = Date.now() - startTime;
      
      // Log activity
      storage.save(activity).catch(err => {
        console.error('Error saving activity log:', err);
      });
      
      return originalJson.apply(this, arguments);
    };
    
    res.end = function(chunk, encoding) {
      if (!activity.statusCode) {
        activity.statusCode = res.statusCode;
        activity.responseTime = Date.now() - startTime;
        
        // Log activity
        storage.save(activity).catch(err => {
          console.error('Error saving activity log:', err);
        });
      }
      
      return originalEnd.apply(this, arguments);
    };
    
    next();
  };
}

// Export storage adapters
activityLog.FileStorage = FileStorage;
activityLog.ConsoleStorage = ConsoleStorage;
activityLog.MemoryStorage = MemoryStorage;

// Export decorator for route-specific logging
activityLog.logActivity = function(options = {}) {
  const middleware = activityLog(options);
  
  return function(req, res, next) {
    return middleware(req, res, next);
  };
};

module.exports = activityLog;