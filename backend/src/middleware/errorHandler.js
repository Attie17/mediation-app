// Centralized Error Handling Middleware
import logger from '../lib/logger.js';
import config from '../config/index.js';

// Custom Error Classes
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.user_id,
    body: req.body,
  });

  // Operational errors (expected) vs programming errors
  if (!err.isOperational && !config.isDevelopment()) {
    // Programming error - log and send generic message
    return res.status(500).json({
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    });
  }

  // Send error response
  const statusCode = err.statusCode || 500;
  const response = {
    ok: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  };

  // Include details in development or if error is operational
  if (config.isDevelopment() || err.isOperational) {
    if (err.details && Object.keys(err.details).length > 0) {
      response.error.details = err.details;
    }
    if (config.isDevelopment() && err.stack) {
      response.error.stack = err.stack;
    }
  }

  res.status(statusCode).json(response);
};

// 404 Handler (must be added after all routes)
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Endpoint');
  error.details = {
    method: req.method,
    path: req.path,
  };
  next(error);
};

// Async Route Handler Wrapper (catches async errors)
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request Logging Middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (req.user) {
      logData.userId = req.user.user_id;
      logData.userRole = req.user.role;
    }

    // Log level based on status code
    const entry = {
      message: 'HTTP request completed',
      ...logData,
    };

    if (res.statusCode >= 500) {
      logger.error(entry);
    } else if (res.statusCode >= 400) {
      logger.warn(entry);
    } else {
      logger.http(entry);
    }
  });

  next();
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestLogger,
};
