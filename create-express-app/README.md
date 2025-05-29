# @nish34/create-express-app

A powerful CLI tool to quickly scaffold professional Express.js applications with your preferred configuration.

## Features

- **Language Options**: Choose between JavaScript or TypeScript
- **Database Integration**: Set up MongoDB, PostgreSQL, or MySQL
- **Project Architecture**: Choose between MVC or Clean Architecture
- **Middleware Selection**: Easily add popular middleware:
  - Morgan (HTTP request logger)
  - Helmet (Security headers)
  - Custom Logger
  - JWT Authentication
  - CORS
- **Advanced Features**:
  - Swagger API Documentation
  - Rate Limiting
  - File Upload
  - Email Service
- **Project Structure**: Organized folder structure following best practices
- **Environment Configuration**: Includes .env setup and example
- **Documentation**: Comprehensive README for your new project

## Installation

```bash
npm install -g @nish34/create-express-app
```

Or use it directly with npx:

```bash
npx @nish34/create-express-app
```

## Usage

Simply run the command and follow the interactive prompts:

```bash
npx @nish34/create-express-app
```

The CLI will guide you through selecting your preferred options and will generate a complete Express application based on your choices.

## Project Structure

The generated project follows a clean, maintainable structure:

### MVC Architecture

```
my-express-app/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── index.js (or index.ts)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Clean Architecture

```
my-express-app/
├── src/
│   ├── config/
│   ├── domain/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── usecases/
│   ├── infrastructure/
│   │   └── database/
│   ├── presentation/
│   │   └── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   └── index.js (or index.ts)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## License

ISC