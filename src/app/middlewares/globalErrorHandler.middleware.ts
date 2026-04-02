import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import { AppError } from '../errorHelpers/AppError';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export const globalErrorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod Validation Error
  if (error instanceof ZodError) {
    const errors = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(422).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  // Prisma Known Request Error
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      res.status(409).json({ success: false, message: `Duplicate value for: ${field}` });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }
    if (error.code === 'P2003') {
      res.status(400).json({ success: false, message: 'Foreign key constraint failed' });
      return;
    }
  }

  // Operational / App Error
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  // JWT Errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
  if (error.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  // Unknown Error
  logger.error('Unexpected error:', error);
  res.status(500).json({
    success: false,
    message: config.isDev ? error.message : 'Internal Server Error',
    ...(config.isDev && { stack: error.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
