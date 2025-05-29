/**
 * express-response-formatter - Standardized API Response Wrapper
 * A middleware that enforces consistent API response formats across routes
 */

/**
 * Main response formatter middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function responseFormatter(options = {}) {
  const defaults = {
    envelope: true,
    errorKey: 'errors',
    dataKey: 'data',
    messageKey: 'message',
    successKey: 'success',
    metaKey: 'meta',
    statusCodeKey: 'statusCode',
    includeStack: process.env.NODE_ENV !== 'production',
    transformData: null,
    errorHandler: null
  };

  const config = { ...defaults, ...options };

  // Override response methods
  return function(req, res, next) {
    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    // Track if response has been sent
    let responseSent = false;
    
    // Helper to format success response
    res.success = function(data, message = '', meta = {}, statusCode = 200) {
      if (responseSent) return this;
      
      this.statusCode = statusCode;
      
      const response = {};
      
      if (config.envelope) {
        response[config.successKey] = true;
        response[config.dataKey] = data;
        response[config.messageKey] = message;
        
        if (Object.keys(meta).length > 0) {
          response[config.metaKey] = meta;
        }
        
        if (config.statusCodeKey) {
          response[config.statusCodeKey] = statusCode;
        }
      } else {
        // If no envelope, just return the data
        Object.assign(response, data);
      }
      
      return originalJson.call(this, response);
    };
    
    // Helper to format error response
    res.error = function(message, errors = [], statusCode = 400, meta = {}) {
      if (responseSent) return this;
      
      this.statusCode = statusCode;
      
      const response = {};
      
      if (config.envelope) {
        response[config.successKey] = false;
        response[config.messageKey] = message;
        
        if (errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0)) {
          response[config.errorKey] = errors;
        }
        
        if (Object.keys(meta).length > 0) {
          response[config.metaKey] = meta;
        }
        
        if (config.statusCodeKey) {
          response[config.statusCodeKey] = statusCode;
        }
      } else {
        response.message = message;
        if (errors) {
          response.errors = errors;
        }
      }
      
      return originalJson.call(this, response);
    };
    
    // Override res.json
    res.json = function(data) {
      if (responseSent) return this;
      
      // If already formatted (from res.success or res.error), just pass through
      if (data && typeof data === 'object' && 
          (data[config.successKey] === true || data[config.successKey] === false)) {
        return originalJson.call(this, data);
      }
      
      // Apply custom data transformation if provided
      if (config.transformData && typeof config.transformData === 'function') {
        data = config.transformData(data, req);
      }
      
      // Format as success response
      return res.success(data);
    };
    
    // Override res.send to handle non-JSON responses
    res.send = function(body) {
      if (responseSent) return this;
      
      // If not an object or already formatted, just pass through
      if (typeof body !== 'object' || body === null) {
        responseSent = true;
        return originalSend.call(this, body);
      }
      
      // Otherwise, treat as json
      return res.json(body);
    };
    
    // Override res.end to track sent responses
    res.end = function(chunk, encoding) {
      responseSent = true;
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
}

/**
 * Error handler middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Express error middleware
 */
responseFormatter.errorHandler = function(options = {}) {
  const defaults = {
    includeStack: process.env.NODE_ENV !== 'production',
    log: true
  };
  
  const config = { ...defaults, ...options };
  
  return function(err, req, res, next) {
    // Skip if headers already sent
    if (res.headersSent) {
      return next(err);
    }
    
    // Log error if enabled
    if (config.log) {
      console.error(err);
    }
    
    // Get status code from error or default to 500
    const statusCode = err.statusCode || err.status || 500;
    
    // Get error message
    const message = err.message || 'Internal Server Error';
    
    // Build error response
    const errorResponse = {
      message
    };
    
    // Include stack trace in development
    if (config.includeStack && err.stack) {
      errorResponse.stack = err.stack;
    }
    
    // Include additional error details if available
    if (err.errors) {
      errorResponse.errors = err.errors;
    }
    
    // Send formatted error response
    res.error(message, err.errors || [], statusCode, {
      ...(config.includeStack && err.stack ? { stack: err.stack } : {})
    });
  };
};

module.exports = responseFormatter;