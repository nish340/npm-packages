import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies the JWT token in the request header
 */
const auth = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    logger.warn('No authentication token provided');
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    
    // Add user from payload
    req.user = (decoded as any).user;
    next();
  } catch (err) {
    logger.error('Invalid token provided');
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;