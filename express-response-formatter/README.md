# express-response-formatter

Standardized API Response Wrapper - A middleware that enforces consistent API response formats across routes.

## Features

- Automatically wraps responses in a { success, data, message, errors } structure
- Works with res.json, res.send, or custom handlers
- Includes error-handling support
- Perfect for teams working with mobile/web clients who need consistent API contracts

## Installation

```bash
npm install @nish34/express-response-formatter
```

## Usage

### Basic Usage

```javascript
const express = require('express');
const responseFormatter = require('@nish34/express-response-formatter');

const app = express();

// Apply the middleware globally
app.use(responseFormatter());

// Regular route - response will be formatted automatically
app.get('/users', (req, res) => {
  const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
  res.json(users);
  // Response: { "success": true, "data": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}], "message": "" }
});

// Using the success helper
app.get('/products', (req, res) => {
  const products = [{ id: 1, name: 'Product A' }];
  res.success(products, 'Products retrieved successfully', { count: 1 });
  // Response: { "success": true, "data": [{"id": 1, "name": "Product A"}], "message": "Products retrieved successfully", "meta": { "count": 1 } }
});

// Using the error helper
app.post('/users', (req, res) => {
  if (!req.body.name) {
    return res.error('Validation failed', [{ field: 'name', message: 'Name is required' }], 422);
    // Response: { "success": false, "message": "Validation failed", "errors": [{"field": "name", "message": "Name is required"}], "statusCode": 422 }
  }
  
  res.success({ id: 3, name: req.body.name }, 'User created', {}, 201);
});

// Add error handler
app.use(responseFormatter.errorHandler());

app.listen(3000);
```

### Advanced Usage

```javascript
const express = require('express');
const responseFormatter = require('@nish34/express-response-formatter');

const app = express();

// Custom configuration
app.use(responseFormatter({
  envelope: true,
  dataKey: 'payload',
  messageKey: 'info',
  errorKey: 'issues',
  metaKey: 'metadata',
  statusCodeKey: 'code',
  transformData: (data, req) => {
    // Add request timestamp to all responses
    if (typeof data === 'object' && data !== null) {
      return {
        ...data,
        timestamp: new Date().toISOString()
      };
    }
    return data;
  }
}));

// Custom error classes
class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 422;
  }
}

// Route with custom error
app.post('/register', (req, res, next) => {
  try {
    const errors = [];
    
    if (!req.body.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }
    
    if (!req.body.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    res.success({ id: 1, email: req.body.email }, 'User registered successfully', {}, 201);
  } catch (err) {
    next(err);
  }
});

// Custom error handler
app.use(responseFormatter.errorHandler({
  includeStack: process.env.NODE_ENV === 'development',
  log: (err) => {
    // Custom logging logic
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  }
}));

app.listen(3000);
```

## Configuration Options

### Main Middleware Options

- `envelope`: Whether to wrap responses in an envelope (default: true)
- `successKey`: Key for success flag (default: 'success')
- `dataKey`: Key for data (default: 'data')
- `messageKey`: Key for message (default: 'message')
- `errorKey`: Key for errors (default: 'errors')
- `metaKey`: Key for metadata (default: 'meta')
- `statusCodeKey`: Key for status code (default: 'statusCode')
- `transformData`: Function to transform data before sending (default: null)

### Error Handler Options

- `includeStack`: Whether to include stack trace in errors (default: true in non-production)
- `log`: Whether to log errors (default: true)

## License

MIT