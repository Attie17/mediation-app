// Backend Environment Configuration
// Centralized configuration management using environment variables

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  host: process.env.HOST || 'localhost',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    name: process.env.DATABASE_NAME || 'mediation_dev',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    expiresIn: '24h',
    devSecret: process.env.DEV_JWT_SECRET || 'dev-jwt-secret-for-testing',
  },

  // CORS
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    // Strict origin validation in production
    validateOrigin: process.env.NODE_ENV === 'production',
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@mediation.local',
      name: process.env.FROM_NAME || 'Mediation Platform',
    },
  },

  // File Storage (Cloudinary)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 86400000, // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Security
  security: {
    enableDevMode: process.env.ENABLE_DEV_MODE === 'true',
    allowedDevRoles: process.env.ALLOWED_DEV_ROLES?.split(',') || [],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR
      || (process.env.LOG_FILE_PATH
        ? path.dirname(path.resolve(process.env.LOG_FILE_PATH))
        : path.join(process.cwd(), 'logs')),
    enableFile: process.env.LOG_FILE_ENABLED !== 'false',
  },

  // Error Tracking (Sentry)
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    enabled: !!process.env.SENTRY_DSN,
  },

  // Feature Flags
  features: {
    ai: process.env.ENABLE_AI_FEATURES !== 'false',
    fileUploads: process.env.ENABLE_FILE_UPLOADS !== 'false',
    emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  },

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Helper methods
  isDevelopment() {
    return this.env === 'development';
  },
  isProduction() {
    return this.env === 'production';
  },
  isTest() {
    return this.env === 'test';
  },
};

// Validation: Check critical env vars in production
if (config.isProduction()) {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables in production:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }

  // Warn about insecure secrets
  if (process.env.JWT_SECRET?.includes('dev') || process.env.JWT_SECRET?.includes('change')) {
    console.warn('⚠️  WARNING: JWT_SECRET appears to be a development value!');
  }
}

export default config;
