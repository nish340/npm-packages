# express-query-builder

Flexible Query Parser for APIs - A middleware that parses query strings into a structured format for database queries.

## Features

- Supports filtering (`?status=active`), sorting (`?sort=-createdAt`), and pagination
- Converts queries to objects for ORMs like Mongoose, Sequelize, Prisma
- Sanitizes and validates input
- Makes building RESTful APIs with flexible querying much easier

## Installation

```bash
npm install @nish34/express-query-builder
```

## Usage

```javascript
const express = require('express');
const queryBuilder = require('@nish34/express-query-builder');

const app = express();

// Basic usage
app.use(queryBuilder());

// With options
app.use(queryBuilder({
  maxLimit: 50,
  defaultLimit: 10,
  allowedFields: ['name', 'email', 'createdAt', 'status'],
  allowedOperators: ['eq', 'ne', 'gt', 'lt']
}));

app.get('/users', (req, res) => {
  // Access the parsed query
  const { filter, sort, pagination } = req.parsedQuery;
  
  // Convert to MongoDB query (if using MongoDB)
  const mongoQuery = queryBuilder.toMongo(req.parsedQuery);
  
  // Use with your database
  // const users = await User.find(mongoQuery.filter)
  //   .sort(mongoQuery.sort)
  //   .skip(mongoQuery.skip)
  //   .limit(mongoQuery.limit);
  
  res.json({ message: 'Query parsed successfully', parsedQuery: req.parsedQuery });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Query Examples

- Filter by status: `GET /users?filter=status:active`
- Sort by creation date (descending): `GET /users?sort=-createdAt`
- Pagination: `GET /users?page=2&limit=10`
- Combined: `GET /users?filter=status:active&sort=-createdAt&page=2&limit=10`

## License

MIT