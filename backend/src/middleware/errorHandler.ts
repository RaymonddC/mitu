/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A record with this unique field already exists'
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
      });
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  return res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.name,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// Helper to create custom errors
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
