# express-api-throttle

Advanced Rate Limiting per Route/User/IP - A customizable rate-limiting middleware with per-user, per-IP, or per-route logic.

## Features

- In-memory or Redis-backed storage
- Custom error responses
- Cooldown periods, burst handling, and dynamic limits
- Helps prevent abuse or DDoS attacks on specific endpoints

## Installation

```bash
npm install @nish34/express-api-throttle
```

## Usage

### Basic Usage

```javascript
const express = require('express');
const throttle = require('@nish34/express-api-throttle');

const app = express();

// Apply rate limiting to all routes
app.use(throttle({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Advanced Usage

```javascript
const express = require('express');
const throttle = require('@nish34/express-api-throttle');
const Redis = require('redis');

const app = express();

// Create Redis client
const redisClient = Redis.createClient();
redisClient.connect().catch(console.error);

// Different limits for different routes
app.get('/api/public', throttle({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
}));

// Stricter limits for login attempts
app.post('/api/login', throttle({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  keyGenerator: (req) => req.body.email || req.ip // Rate limit by email or IP
}));

// Using Redis for distributed environments
app.post('/api/sensitive', throttle({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  store: new throttle.RedisStore(redisClient),
  keyGenerator: (req) => req.user ? req.user.id : req.ip, // Rate limit by user ID if authenticated
  onLimitReached: (req, res) => {
    console.log(`Rate limit exceeded for user: ${req.user ? req.user.id : req.ip}`);
  }
}));

app.listen(3000);
```

## Configuration Options

- `windowMs`: Time window in milliseconds (default: 60000)
- `max`: Maximum number of requests within the time window (default: 60)
- `message`: Error message when rate limit is exceeded (default: 'Too many requests')
- `statusCode`: HTTP status code when rate limit is exceeded (default: 429)
- `keyGenerator`: Function to generate unique identifier (default: req.ip)
- `skip`: Function to determine whether to skip rate limiting (default: () => false)
- `store`: Storage for tracking requests (default: MemoryStore)
- `headers`: Whether to add rate limit headers (default: true)
- `handler`: Custom function to handle when rate limit is exceeded
- `onLimitReached`: Function called when rate limit is reached

## License

MIT