// Logging Configuration using Winston
import winston from 'winston';
import config from '../config/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports (where logs go)
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
      )
    ),
  })
);

// File transport (production only or if explicitly enabled)
if (config.isProduction() || config.logging.enableFile) {
  const configuredDir = config.logging.dir || path.join(__dirname, '../../logs');
  const logDir = path.isAbsolute(configuredDir)
    ? configuredDir
    : path.join(process.cwd(), configuredDir);

  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (mkdirError) {
    // Fall back to console only if directory creation fails
    console.error('[logger] Failed to create log directory:', mkdirError);
  }

  // Error logs file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined logs file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level || (config.isDevelopment() ? 'debug' : 'info'),
  levels,
  format,
  transports,
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// Create a stream object for Morgan (HTTP request logging)
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Helper methods for structured logging
logger.logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

logger.logRequest = (req, context = {}) => {
  logger.http({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.user_id,
    ...context,
  });
};

logger.logActivity = (action, userId, details = {}) => {
  logger.info({
    type: 'activity',
    action,
    userId,
    ...details,
  });
};

// Log unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    message: 'Unhandled Rejection',
    reason,
    promise,
  });
});

process.on('uncaughtException', (error) => {
  logger.error({
    message: 'Uncaught Exception',
    error: error.message,
    stack: error.stack,
  });
  // Give winston time to write logs before exiting
  setTimeout(() => process.exit(1), 1000);
});

export default logger;
