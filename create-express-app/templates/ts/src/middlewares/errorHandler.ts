import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Global error handling middleware
 */
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack || '');

  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export default errorHandler;