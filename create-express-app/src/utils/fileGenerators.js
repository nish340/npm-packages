const fs = require('fs-extra');
const path = require('path');

function createJsIndexFile(targetDir, options) {
  const { database, features } = options;
  
  let content = `const express = require('express');\n`;
  content += `const dotenv = require('dotenv');\n`;
  
  if (features.morgan) {
    content += `const morgan = require('morgan');\n`;
  }
  
  if (features.helmet) {
    content += `const helmet = require('helmet');\n`;
  }
  
  if (features.cors) {
    content += `const cors = require('cors');\n`;
  }
  
  if (database === 'mongodb') {
    content += `const connectDB = require('./config/database');\n`;
  }
  
  content += `\n// Load environment variables\n`;
  content += `dotenv.config();\n\n`;
  
  if (database === 'mongodb') {
    content += `// Connect to database\n`;
    content += `connectDB();\n\n`;
  }
  
  content += `const app = express();\n`;
  content += `const PORT = process.env.PORT || 3000;\n\n`;
  
  content += `// Middleware\n`;
  content += `app.use(express.json());\n`;
  content += `app.use(express.urlencoded({ extended: true }));\n`;
  
  if (features.morgan) {
    content += `app.use(morgan('dev'));\n`;
  }
  
  if (features.helmet) {
    content += `app.use(helmet());\n`;
  }
  
  if (features.cors) {
    content += `app.use(cors());\n`;
  }
  
  if (features.logger) {
    content += `const logger = require('./middlewares/logger');\n`;
    content += `app.use(logger);\n`;
  }
  
  content += `\n// Routes\n`;
  content += `app.use('/api', require('./routes'));\n\n`;
  
  if (features.swagger) {
    content += `// Swagger Documentation\n`;
    content += `const swaggerUi = require('swagger-ui-express');\n`;
    content += `const swaggerDocs = require('./config/swagger');\n`;
    content += `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));\n\n`;
  }
  
  content += `// Error handling middleware\n`;
  content += `app.use((err, req, res, next) => {\n`;
  content += `  console.error(err.stack);\n`;
  content += `  res.status(500).json({ error: 'Server error' });\n`;
  content += `});\n\n`;
  
  content += `// Start server\n`;
  content += `app.listen(PORT, () => {\n`;
  content += `  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);\n`;
  if (features.swagger) {
    content += `  console.log(\`📚 API Documentation available at http://localhost:\${PORT}/api-docs\`);\n`;
  }
  content += `});\n`;
  
  fs.writeFileSync(path.join(targetDir, 'src', 'index.js'), content);
}

function createTsIndexFile(targetDir, options) {
  const { database, features } = options;
  
  let content = `import express, { Application, Request, Response, NextFunction } from 'express';\n`;
  content += `import dotenv from 'dotenv';\n`;
  
  if (features.morgan) {
    content += `import morgan from 'morgan';\n`;
  }
  
  if (features.helmet) {
    content += `import helmet from 'helmet';\n`;
  }
  
  if (features.cors) {
    content += `import cors from 'cors';\n`;
  }
  
  if (database === 'mongodb') {
    content += `import connectDB from './config/database';\n`;
  }
  
  content += `\n// Load environment variables\n`;
  content += `dotenv.config();\n\n`;
  
  if (database === 'mongodb') {
    content += `// Connect to database\n`;
    content += `connectDB();\n\n`;
  }
  
  content += `const app: Application = express();\n`;
  content += `const PORT: number = parseInt(process.env.PORT || '3000', 10);\n\n`;
  
  content += `// Middleware\n`;
  content += `app.use(express.json());\n`;
  content += `app.use(express.urlencoded({ extended: true }));\n`;
  
  if (features.morgan) {
    content += `app.use(morgan('dev'));\n`;
  }
  
  if (features.helmet) {
    content += `app.use(helmet());\n`;
  }
  
  if (features.cors) {
    content += `app.use(cors());\n`;
  }
  
  if (features.logger) {
    content += `import logger from './middlewares/logger';\n`;
    content += `app.use(logger);\n`;
  }
  
  content += `\n// Routes\n`;
  content += `import routes from './routes';\n`;
  content += `app.use('/api', routes);\n\n`;
  
  if (features.swagger) {
    content += `// Swagger Documentation\n`;
    content += `import swaggerUi from 'swagger-ui-express';\n`;
    content += `import swaggerDocs from './config/swagger';\n`;
    content += `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));\n\n`;
  }
  
  content += `// Error handling middleware\n`;
  content += `app.use((err: Error, req: Request, res: Response, next: NextFunction) => {\n`;
  content += `  console.error(err.stack);\n`;
  content += `  res.status(500).json({ error: 'Server error' });\n`;
  content += `});\n\n`;
  
  content += `// Start server\n`;
  content += `app.listen(PORT, () => {\n`;
  content += `  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);\n`;
  if (features.swagger) {
    content += `  console.log(\`📚 API Documentation available at http://localhost:\${PORT}/api-docs\`);\n`;
  }
  content += `});\n`;
  
  fs.writeFileSync(path.join(targetDir, 'src', 'index.ts'), content);
}

module.exports = {
  createJsIndexFile,
  createTsIndexFile
};