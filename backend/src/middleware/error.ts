import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred.';

  // If it's a custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } 
  // If it's a validation ZodError
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
  }
  // Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  }
  // Mongoose duplicate key error
  else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 400;
    code = 'DUPLICATE_KEY_ERROR';
    const fields = Object.keys((err as any).keyValue || {});
    message = `Duplicate value for field(s): ${fields.join(', ')}.`;
  }
  // Mongoose cast errors (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = `Invalid value for ${(err as any).path}: ${(err as any).value}.`;
  }

  // Log error if it's a 500 server error
  if (statusCode === 500) {
    console.error(`[Unhandled Error] ${err.stack || err}`);
  } else {
    console.warn(`[API Warning] ${code}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
