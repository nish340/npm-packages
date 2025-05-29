# Express TypeScript Application

This project was generated with [@nish34/create-express-app](https://www.npmjs.com/package/@nish34/create-express-app).

## Features

- RESTful API with Express and TypeScript
- MongoDB integration with Mongoose
- JWT Authentication
- Swagger API Documentation
- Winston Logger
- Email Service
- Error Handling
- Security with Helmet and CORS

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- MongoDB

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy `.env.example` to `.env` and update the values.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Project Structure

```
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middlewares/  # Custom middlewares
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── utils/        # Utility functions
│   └── index.ts      # App entry point
├── .env              # Environment variables
├── .gitignore        # Git ignore file
├── tsconfig.json     # TypeScript configuration
└── package.json      # Project dependencies
```