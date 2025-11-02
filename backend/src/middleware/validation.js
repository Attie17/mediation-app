// Input Validation Middleware using express-validator
import { body, param, query, validationResult } from 'express-validator';

// Validation Error Handler
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common Validators
export const validators = {
  // Email validation
  email: body('email')
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),

  // Password validation
  password: body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain special character (@$!%*?&#)'),

  // Name validation
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),

  // Organization name
  orgName: body('name')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Organization name must be 2-200 characters'),

  // UUID validation
  uuid: param('id')
    .isUUID().withMessage('Invalid ID format'),

  // Numeric ID validation
  numericId: param('id')
    .isInt({ min: 1 }).withMessage('Invalid ID'),

  // Role validation
  role: body('role')
    .isIn(['admin', 'mediator', 'lawyer', 'divorcee']).withMessage('Invalid role'),

  // Phone validation (optional)
  phone: body('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),

  // URL validation
  url: body('url')
    .optional()
    .isURL().withMessage('Invalid URL format'),

  // Color hex validation
  colorHex: body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format (must be #RRGGBB)'),

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  ],
};

// Specific Validation Chains for Routes

// User Registration
export const validateUserRegistration = [
  validators.email,
  validators.password,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
  body('role').optional().isIn(['mediator', 'lawyer', 'divorcee']).withMessage('Invalid role for registration'),
  validateRequest
];

// User Sign In
export const validateSignIn = [
  validators.email,
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// Create Organization
export const validateCreateOrganization = [
  validators.orgName,
  body('display_name').optional().trim().isLength({ max: 200 }),
  body('email').optional().isEmail().normalizeEmail(),
  validators.phone,
  body('address').optional().trim().isLength({ max: 500 }),
  body('website').optional().isURL(),
  body('subscription_tier').optional().isIn(['trial', 'basic', 'pro', 'enterprise']),
  validateRequest
];

// Update Organization
export const validateUpdateOrganization = [
  body('name').optional().trim().isLength({ min: 2, max: 200 }),
  body('display_name').optional().trim().isLength({ max: 200 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/),
  body('primary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('secondary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('logo_url').optional().isURL(),
  body('tagline').optional().trim().isLength({ max: 200 }),
  validateRequest
];

// Invite User
export const validateInviteUser = [
  validators.email,
  validators.role,
  body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message too long'),
  validateRequest
];

// Create Case
export const validateCreateCase = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('mediator_id').optional().isInt({ min: 1 }),
  body('organization_id').optional().isInt({ min: 1 }),
  validateRequest
];

// Update Case
export const validateUpdateCase = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['pending', 'active', 'resolved', 'cancelled']),
  validateRequest
];

// Send Message
export const validateSendMessage = [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters'),
  body('channel_id').notEmpty().withMessage('Channel ID required'),
  validateRequest
];

// File Upload Validation (metadata only, actual file handled by multer)
export const validateFileMetadata = [
  body('filename').trim().isLength({ min: 1, max: 255 }),
  body('file_type').optional().isIn(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xlsx', 'csv']),
  body('case_id').optional().isInt({ min: 1 }),
  validateRequest
];

/**
 * XSS Prevention - Sanitize string input
 * Removes potentially dangerous characters and patterns
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove potential XSS vectors
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .replace(/eval\(/gi, '') // Remove eval calls
    .trim();
}

/**
 * Recursively sanitize object
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Middleware to sanitize all incoming request data
 * SECURITY: Prevents XSS attacks by removing dangerous characters
 */
function applySanitized(target, sanitized) {
  if (target && typeof target === 'object') {
    if (Array.isArray(target) && Array.isArray(sanitized)) {
      target.splice(0, target.length, ...sanitized);
      return target;
    }

    Object.keys(target).forEach((key) => {
      delete target[key];
    });

    if (sanitized && typeof sanitized === 'object') {
      Object.assign(target, sanitized);
      return target;
    }
  }

  return sanitized;
}

export function sanitizeInput(req, res, next) {
  if (req.body) {
    const sanitizedBody = sanitizeObject(req.body);
    if (req.body && typeof req.body === 'object') {
      applySanitized(req.body, sanitizedBody);
    } else {
      req.body = sanitizedBody;
    }
  }
  if (req.query) {
    const sanitizedQuery = sanitizeObject(req.query);
    applySanitized(req.query, sanitizedQuery);
  }
  if (req.params) {
    const sanitizedParams = sanitizeObject(req.params);
    applySanitized(req.params, sanitizedParams);
  }
  next();
}

export default {
  validateRequest,
  validators,
  validateUserRegistration,
  validateSignIn,
  validateCreateOrganization,
  validateUpdateOrganization,
  validateInviteUser,
  validateCreateCase,
  validateUpdateCase,
  validateSendMessage,
  validateFileMetadata,
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
};
