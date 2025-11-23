import logger from '../lib/logger.js';

/**
 * Lightweight logger for AI endpoints so we can monitor volume and latency.
 * Attaches after auth (so req.user may exist) and records every response.
 */
export const aiUsageLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info('[ai] request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id || null,
    });
  });
  next();
};

export default aiUsageLogger;
