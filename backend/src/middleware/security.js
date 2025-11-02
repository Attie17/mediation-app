// Security Middleware - Rate Limiting, Helmet, Input Validation
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import config from '../config/index.js';

// Helmet - Security Headers
// Comprehensive security headers for production
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow external images (Cloudinary, etc.)
      connectSrc: ["'self'", config.frontendUrl, "https://*.supabase.co"], // Allow Supabase
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: config.env === 'production' ? [] : null, // Upgrade HTTP to HTTPS in production
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false }, // Disable DNS prefetching
  frameguard: { action: 'deny' }, // Prevent clickjacking
  hidePoweredBy: true, // Remove X-Powered-By header
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true, // Set X-Download-Options for IE8+
  noSniff: true, // Prevent MIME type sniffing
  originAgentCluster: true, // Isolate document to its origin
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true, // Enable XSS filter
});

// Rate Limiting - General API
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.max, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) + ' minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/healthz' || req.path === '/';
  },
});

// Strict Rate Limiting - Authentication Endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts (increased for testing)
  message: {
    error: 'Too many login attempts, please try again after 15 minutes.',
    lockoutDuration: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Moderate Rate Limiting - User Creation/Invitations
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 creations per hour
  message: {
    error: 'Too many accounts created from this IP, please try again later.',
  },
});

// Email Rate Limiting
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 emails per hour
  message: {
    error: 'Too many emails sent, please try again later.',
  },
});

// Request Size Limiting Middleware
export const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      error: 'Request entity too large',
      maxSize: '10MB'
    });
  }

  next();
};

export default {
  securityHeaders,
  apiLimiter,
  authLimiter,
  createLimiter,
  emailLimiter,
  requestSizeLimiter,
};
