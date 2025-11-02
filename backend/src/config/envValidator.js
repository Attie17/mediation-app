/**
 * Environment Variable Validator
 * Validates all required environment variables on application startup
 * Fails fast if critical variables are missing or invalid
 */

import logger from '../lib/logger.js';

/**
 * Required environment variables for production
 */
const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'FRONTEND_URL',
];

/**
 * Required environment variables for email functionality
 */
const EMAIL_REQUIRED_VARS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'FROM_EMAIL',
];

/**
 * Required environment variables for file uploads
 */
const FILE_STORAGE_REQUIRED_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

/**
 * Validate that an environment variable exists and is not empty
 */
function validateVar(varName, required = true) {
  const value = process.env[varName];
  
  if (!value || value.trim() === '') {
    if (required) {
      return { valid: false, message: `${varName} is required but not set` };
    }
    return { valid: true, warning: `${varName} is not set (optional)` };
  }
  
  // Check for placeholder values
  const placeholders = ['CHANGE_ME', 'your-', 'example.com', 'test-', 'dev-'];
  const hasPlaceholder = placeholders.some(p => value.includes(p));
  
  if (hasPlaceholder && required) {
    return { 
      valid: false, 
      message: `${varName} contains placeholder value: "${value.substring(0, 50)}..."` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate JWT_SECRET strength
 */
function validateJwtSecret() {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    return { valid: false, message: 'JWT_SECRET is required' };
  }
  
  if (secret.length < 32) {
    return { 
      valid: false, 
      message: `JWT_SECRET is too short (${secret.length} chars). Minimum 32 characters required.` 
    };
  }
  
  // Check for common weak secrets
  const weakSecrets = ['secret', 'password', 'test', 'dev', '123', 'change'];
  const isWeak = weakSecrets.some(w => secret.toLowerCase().includes(w));
  
  if (isWeak) {
    return { 
      valid: false, 
      message: 'JWT_SECRET appears to be weak or a default value. Generate a strong random secret.' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate SESSION_SECRET strength
 */
function validateSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    return { valid: false, message: 'SESSION_SECRET is required' };
  }
  
  if (secret.length < 32) {
    return { 
      valid: false, 
      message: `SESSION_SECRET is too short (${secret.length} chars). Minimum 32 characters required.` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate DATABASE_URL format
 */
function validateDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    return { valid: false, message: 'DATABASE_URL is required' };
  }
  
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    return { 
      valid: false, 
      message: 'DATABASE_URL must start with postgresql:// or postgres://' 
    };
  }
  
  // In production, should use SSL
  if (process.env.NODE_ENV === 'production' && !url.includes('sslmode=require')) {
    return {
      valid: false,
      message: 'DATABASE_URL should include sslmode=require in production'
    };
  }
  
  return { valid: true };
}

/**
 * Validate FRONTEND_URL format
 */
function validateFrontendUrl() {
  const url = process.env.FRONTEND_URL;
  
  if (!url) {
    return { valid: false, message: 'FRONTEND_URL is required' };
  }
  
  if (url.endsWith('/')) {
    return {
      valid: false,
      message: 'FRONTEND_URL should not have trailing slash'
    };
  }
  
  if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
    return {
      valid: false,
      message: 'FRONTEND_URL should not use localhost in production'
    };
  }
  
  if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
    return {
      valid: false,
      message: 'FRONTEND_URL must use HTTPS in production'
    };
  }
  
  return { valid: true };
}

/**
 * Validate security flags
 */
function validateSecurityFlags() {
  const errors = [];
  
  if (process.env.NODE_ENV === 'production') {
    if (process.env.ENABLE_DEV_MODE === 'true') {
      errors.push('ENABLE_DEV_MODE must be false in production');
    }
    
    if (process.env.DEV_AUTH_ENABLED === 'true') {
      errors.push('DEV_AUTH_ENABLED must be false in production');
    }
  }
  
  return errors.length > 0 
    ? { valid: false, message: errors.join('; ') }
    : { valid: true };
}

/**
 * Main validation function
 */
export function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.info('🔍 Validating environment variables...');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Validate required production variables
  if (isProduction) {
    for (const varName of REQUIRED_PRODUCTION_VARS) {
      const result = validateVar(varName, true);
      if (!result.valid) {
        errors.push(result.message);
      } else if (result.warning) {
        warnings.push(result.warning);
      }
    }
  }
  
  // Validate JWT_SECRET
  const jwtResult = validateJwtSecret();
  if (!jwtResult.valid) {
    errors.push(jwtResult.message);
  }
  
  // Validate SESSION_SECRET
  const sessionResult = validateSessionSecret();
  if (!sessionResult.valid) {
    errors.push(sessionResult.message);
  }
  
  // Validate DATABASE_URL
  const dbResult = validateDatabaseUrl();
  if (!dbResult.valid) {
    errors.push(dbResult.message);
  }
  
  // Validate FRONTEND_URL
  const frontendResult = validateFrontendUrl();
  if (!frontendResult.valid) {
    errors.push(frontendResult.message);
  }
  
  // Validate security flags
  const securityResult = validateSecurityFlags();
  if (!securityResult.valid) {
    errors.push(securityResult.message);
  }
  
  // Check email configuration if email features enabled
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
    for (const varName of EMAIL_REQUIRED_VARS) {
      const result = validateVar(varName, isProduction);
      if (!result.valid) {
        if (isProduction) {
          errors.push(result.message);
        } else {
          warnings.push(`${varName} not set - email features will not work`);
        }
      }
    }
  } else {
    warnings.push('Email notifications disabled - SMTP variables not required');
  }
  
  // Check file storage configuration if uploads enabled
  if (process.env.ENABLE_FILE_UPLOADS === 'true') {
    for (const varName of FILE_STORAGE_REQUIRED_VARS) {
      const result = validateVar(varName, isProduction);
      if (!result.valid) {
        if (isProduction) {
          errors.push(result.message);
        } else {
          warnings.push(`${varName} not set - file uploads will use local storage`);
        }
      }
    }
  } else {
    warnings.push('File uploads disabled - Cloudinary variables not required');
  }
  
  // Log warnings
  if (warnings.length > 0) {
    logger.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => logger.warn(`   - ${warning}`));
  }
  
  // Handle errors
  if (errors.length > 0) {
    logger.error('❌ Environment validation failed:');
    errors.forEach(error => logger.error(`   - ${error}`));
    logger.error('');
    logger.error('💡 Fix these issues before starting the application.');
    logger.error('   See backend/.env.production.example for configuration template.');
    logger.error('');
    
    if (isProduction) {
      process.exit(1);
    } else {
      logger.warn('⚠️  Continuing in development mode with validation errors.');
      logger.warn('   These errors will cause the application to exit in production.');
    }
  } else {
    logger.info('✅ Environment validation passed');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate a secure random secret
 * Usage: node -e "import('./src/config/envValidator.js').then(m => m.generateSecret().then(console.log))"
 */
export async function generateSecret(length = 64) {
  const crypto = await import('crypto');
  return crypto.randomBytes(length).toString('hex');
}
