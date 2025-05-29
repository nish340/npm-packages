/**
 * express-query-builder - Flexible Query Parser for APIs
 * A middleware that parses query strings into a structured format for database queries
 */

/**
 * Main middleware function
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function queryBuilder(options = {}) {
  const defaults = {
    maxLimit: 100,
    defaultLimit: 20,
    allowedFields: null, // null means all fields allowed
    allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'regex']
  };

  const config = { ...defaults, ...options };

  return function(req, res, next) {
    const query = {};
    
    // Handle filtering
    if (req.query.filter) {
      query.filter = parseFilter(req.query.filter, config.allowedFields, config.allowedOperators);
    }
    
    // Handle sorting
    if (req.query.sort) {
      query.sort = parseSort(req.query.sort, config.allowedFields);
    }
    
    // Handle pagination
    query.pagination = parsePagination(req.query, config);
    
    // Attach the parsed query to the request object
    req.parsedQuery = query;
    
    next();
  };
}

/**
 * Parse filter parameters
 * @param {Object|String} filter - Filter parameters
 * @param {Array} allowedFields - Allowed fields to filter on
 * @param {Array} allowedOperators - Allowed operators
 * @returns {Object} Parsed filter object
 */
function parseFilter(filter, allowedFields, allowedOperators) {
  let parsedFilter = {};
  
  // Handle string format (filter=field:value,field2:value2)
  if (typeof filter === 'string') {
    filter.split(',').forEach(part => {
      const [field, value] = part.split(':');
      if (isFieldAllowed(field, allowedFields)) {
        parsedFilter[field] = { eq: sanitize(value) };
      }
    });
  } 
  // Handle object format
  else if (typeof filter === 'object') {
    Object.keys(filter).forEach(field => {
      if (isFieldAllowed(field, allowedFields)) {
        parsedFilter[field] = { eq: sanitize(filter[field]) };
      }
    });
  }
  
  return parsedFilter;
}

/**
 * Parse sort parameters
 * @param {String} sort - Sort string (e.g. "-createdAt,name")
 * @param {Array} allowedFields - Allowed fields to sort by
 * @returns {Object} Parsed sort object
 */
function parseSort(sort, allowedFields) {
  const parsedSort = {};
  
  sort.split(',').forEach(field => {
    let sortOrder = 1; // 1 for ascending, -1 for descending
    let fieldName = field;
    
    if (field.startsWith('-')) {
      sortOrder = -1;
      fieldName = field.substring(1);
    }
    
    if (isFieldAllowed(fieldName, allowedFields)) {
      parsedSort[fieldName] = sortOrder;
    }
  });
  
  return parsedSort;
}

/**
 * Parse pagination parameters
 * @param {Object} query - Express query object
 * @param {Object} config - Configuration options
 * @returns {Object} Pagination object
 */
function parsePagination(query, config) {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || config.defaultLimit;
  
  // Ensure limit doesn't exceed maxLimit
  limit = Math.min(limit, config.maxLimit);
  
  // Ensure page is at least 1
  page = Math.max(1, page);
  
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

/**
 * Check if a field is allowed
 * @param {String} field - Field name
 * @param {Array} allowedFields - List of allowed fields
 * @returns {Boolean} Whether the field is allowed
 */
function isFieldAllowed(field, allowedFields) {
  return !allowedFields || allowedFields.includes(field);
}

/**
 * Sanitize input value
 * @param {*} value - Input value
 * @returns {*} Sanitized value
 */
function sanitize(value) {
  // Basic sanitization
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
}

/**
 * Convert parsed query to MongoDB format
 * @param {Object} parsedQuery - Parsed query object
 * @returns {Object} MongoDB query object
 */
queryBuilder.toMongo = function(parsedQuery) {
  const result = {};
  
  // Convert filters to MongoDB format
  if (parsedQuery.filter) {
    const filter = {};
    
    Object.keys(parsedQuery.filter).forEach(field => {
      const conditions = parsedQuery.filter[field];
      
      Object.keys(conditions).forEach(op => {
        const value = conditions[op];
        
        switch(op) {
          case 'eq': filter[field] = value; break;
          case 'ne': filter[field] = { $ne: value }; break;
          case 'gt': filter[field] = { $gt: value }; break;
          case 'gte': filter[field] = { $gte: value }; break;
          case 'lt': filter[field] = { $lt: value }; break;
          case 'lte': filter[field] = { $lte: value }; break;
          case 'in': filter[field] = { $in: Array.isArray(value) ? value : [value] }; break;
          case 'nin': filter[field] = { $nin: Array.isArray(value) ? value : [value] }; break;
          case 'regex': filter[field] = { $regex: value, $options: 'i' }; break;
        }
      });
    });
    
    result.filter = filter;
  }
  
  // Convert sort to MongoDB format
  if (parsedQuery.sort) {
    result.sort = parsedQuery.sort;
  }
  
  // Add pagination
  if (parsedQuery.pagination) {
    result.skip = parsedQuery.pagination.skip;
    result.limit = parsedQuery.pagination.limit;
  }
  
  return result;
};

module.exports = queryBuilder;