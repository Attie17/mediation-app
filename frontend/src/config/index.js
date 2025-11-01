// Frontend Environment Configuration
// Centralized configuration using Vite environment variables

const config = {
  // API
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://mediation-app-production.up.railway.app',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 10) || 30000,
  },

  // Environment
  env: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development',

  // Feature Flags
  features: {
    ai: import.meta.env.VITE_ENABLE_AI_FEATURES !== 'false',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    devTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
  },

  // Analytics
  analytics: {
    gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID || '',
    plausibleDomain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || '',
  },

  // Error Tracking (Sentry)
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    enabled: !!import.meta.env.VITE_SENTRY_DSN,
  },

  // App Info
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Mediation Platform',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@mediation.app',
  },

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

// Log configuration in development
if (config.isDevelopment()) {
  console.log('🔧 Frontend Config:', {
    env: config.env,
    apiBaseUrl: config.api.baseUrl,
    features: config.features,
  });
}

export default config;
