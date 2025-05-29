# express-activity-log

Middleware for Logging User Activity - Tracks and logs user actions like route access, data changes, or failed attempts.

## Features

- Logs IP, user ID, route, HTTP method, and body params
- Plug-in storage support (file, console, memory, custom)
- Middleware or decorator-based usage
- Great for auditing, debugging, or compliance tracking

## Installation

```bash
npm install @nish34/express-activity-log
```

## Usage

### Basic Usage

```javascript
const express = require('express');
const activityLog = require('@nish34/express-activity-log');

const app = express();

// Parse JSON body
app.use(express.json());

// Apply activity logging middleware globally
app.use(activityLog());

app.get('/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});

app.post('/users', (req, res) => {
  res.status(201).json({ id: 2, name: req.body.name });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Advanced Usage

```javascript
const express = require('express');
const activityLog = require('@nish34/express-activity-log');
const winston = require('winston');

const app = express();
app.use(express.json());

// Custom Winston logger adapter
class WinstonStorage {
  constructor(logger) {
    this.logger = logger;
  }
  
  async save(activity) {
    this.logger.info('User Activity', { activity });
    return Promise.resolve();
  }
}

// Create Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'activity.log' }),
    new winston.transports.Console()
  ]
});

// Configure activity logging with custom options
app.use(activityLog({
  storage: 'custom',
  storageOptions: {
    adapter: new WinstonStorage(logger)
  },
  exclude: ['/health', '/metrics', /^\/public\//],
  sensitiveFields: ['password', 'token', 'secret', 'creditCard'],
  getUserInfo: (req) => {
    return {
      id: req.user ? req.user.id : null,
      email: req.user ? req.user.email : null,
      role: req.user ? req.user.role : null
    };
  },
  customData: (req) => {
    return {
      correlationId: req.headers['x-correlation-id'],
      source: req.headers['x-source']
    };
  }
}));

// Route-specific logging with decorator
app.post('/payments', activityLog.logActivity({
  logBody: false, // Don't log payment details
  getActivityType: () => 'payment-processing'
}), (req, res) => {
  res.json({ success: true });
});

app.listen(3000);
```

### MongoDB Integration Example

```javascript
const express = require('express');
const activityLog = require('@nish34/express-activity-log');
const mongoose = require('mongoose');

// Define MongoDB schema for activity logs
const ActivitySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  method: String,
  path: String,
  ip: String,
  userAgent: String,
  type: String,
  user: {
    id: mongoose.Schema.Types.ObjectId,
    username: String
  },
  params: Object,
  query: Object,
  body: Object,
  statusCode: Number,
  responseTime: Number
}, { timestamps: true });

const Activity = mongoose.model('Activity', ActivitySchema);

// Custom MongoDB storage adapter
class MongoStorage {
  async save(activity) {
    try {
      await Activity.create(activity);
    } catch (err) {
      console.error('Error saving activity to MongoDB:', err);
    }
    return Promise.resolve();
  }
}

const app = express();
app.use(express.json());

// Use MongoDB storage adapter
app.use(activityLog({
  storage: 'custom',
  storageOptions: {
    adapter: new MongoStorage()
  }
}));

app.listen(3000);
```

## Configuration Options

- `storage`: Storage type ('file', 'console', 'memory', 'custom', default: 'file')
- `storageOptions`: Options for the selected storage
  - For 'file' storage:
    - `logDir`: Directory for log files (default: './logs')
    - `filename`: Log filename (default: 'activity.log')
    - `maxSize`: Maximum log file size in bytes (default: 10MB)
    - `maxFiles`: Maximum number of rotated log files (default: 5)
  - For 'console' storage:
    - `logLevel`: Console log level (default: 'info')
  - For 'custom' storage:
    - `adapter`: Custom storage adapter with save() method
- `exclude`: Array of paths or regex patterns to exclude from logging
- `include`: Array of paths or regex patterns to include in logging (if null, all routes are included)
- `logBody`: Whether to log request body (default: true)
- `logQuery`: Whether to log query parameters (default: true)
- `logParams`: Whether to log route parameters (default: true)
- `sensitiveFields`: Array of field names to redact (default: ['password', 'token', 'secret', 'authorization'])
- `getUserInfo`: Function to extract user info from request
- `getActivityType`: Function to determine activity type from request
- `customData`: Function to add custom data to log entries

## License

MIT