/**
 * Health Check Routes
 * Provides endpoints for monitoring application health and readiness
 * Used by load balancers, monitoring systems, and DevOps tools
 */

import express from 'express';
import { pool } from '../db.js';
import logger from '../lib/logger.js';
import config from '../config/index.js';

const router = express.Router();

/**
 * Basic health check - Returns 200 if server is running
 * GET /health
 */
router.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check with dependency status
 * GET /api/health
 * Checks:
 * - Database connectivity
 * - Memory usage
 * - Process uptime
 * - Environment configuration
 */
router.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    checks: {},
  };

  let overallStatus = 200;

  // Check database connectivity
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const duration = Date.now() - start;
    
    health.checks.database = {
      status: 'healthy',
      responseTime: `${duration}ms`,
      message: 'Database connection successful',
    };
  } catch (error) {
    health.checks.database = {
      status: 'unhealthy',
      error: error.message,
      message: 'Database connection failed',
    };
    health.status = 'unhealthy';
    overallStatus = 503;
    logger.error('[health] Database check failed', { error: error.message });
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };

  // Warn if heap usage is over 80%
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = {
    status: heapUsagePercent > 90 ? 'warning' : 'healthy',
    usage: memUsageMB,
    heapUsagePercent: Math.round(heapUsagePercent),
    message: heapUsagePercent > 90 ? 'High memory usage' : 'Memory usage normal',
  };

  if (heapUsagePercent > 90) {
    logger.warn('[health] High memory usage', { heapUsagePercent });
  }

  // Check required environment variables
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  health.checks.environment = {
    status: missingVars.length === 0 ? 'healthy' : 'unhealthy',
    missingVariables: missingVars.length > 0 ? missingVars : undefined,
    message: missingVars.length === 0 
      ? 'All required environment variables are set' 
      : `Missing ${missingVars.length} required environment variable(s)`,
  };

  if (missingVars.length > 0) {
    health.status = 'unhealthy';
    overallStatus = 503;
  }

  // Check Node.js version
  health.checks.nodejs = {
    status: 'healthy',
    version: process.version,
    message: `Running Node.js ${process.version}`,
  };

  // Add process info
  health.process = {
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
  };

  res.status(overallStatus).json(health);
});

/**
 * Readiness check - Indicates if the app is ready to receive traffic
 * GET /api/health/ready
 * Returns 200 when ready, 503 when not ready
 */
router.get('/api/health/ready', async (req, res) => {
  try {
    // Check if database is ready
    await pool.query('SELECT 1');
    
    // Check if required services are initialized
    const isReady = true; // Add more checks as needed
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Application is ready to receive traffic',
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Application is not yet ready',
      });
    }
  } catch (error) {
    logger.error('[health:ready] Readiness check failed', { error: error.message });
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      message: 'Readiness check failed',
      error: error.message,
    });
  }
});

/**
 * Liveness check - Indicates if the app is alive
 * GET /api/health/live
 * Returns 200 if alive, should never return 503 unless app is completely dead
 */
router.get('/api/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Application is alive',
  });
});

export default router;
