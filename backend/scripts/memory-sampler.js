#!/usr/bin/env node
/**
 * Periodically logs heap usage to help diagnose memory growth in production.
 * Usage: node scripts/memory-sampler.js (runs until process exit)
 * Configure interval via MEMORY_SAMPLER_INTERVAL_MS env (default 30000).
 */

const interval = parseInt(process.env.MEMORY_SAMPLER_INTERVAL_MS || '30000', 10);

console.log(`[memory-sampler] Starting. Interval=${interval}ms PID=${process.pid}`);
let samples = 0;

function format(bytes) {
  const mb = bytes / 1024 / 1024;
  return mb.toFixed(2) + 'MB';
}

function snapshot() {
  const m = process.memoryUsage();
  const entry = {
    rss: format(m.rss),
    heapTotal: format(m.heapTotal),
    heapUsed: format(m.heapUsed),
    external: format(m.external || 0),
    arrayBuffers: format(m.arrayBuffers || 0),
    time: new Date().toISOString(),
  };
  samples++;
  console.log(`[memory-sampler] #${samples} ${JSON.stringify(entry)}`);
}

snapshot();
const timer = setInterval(snapshot, interval);

process.on('SIGINT', () => {
  console.log('[memory-sampler] Caught SIGINT. Total samples:', samples);
  clearInterval(timer);
  process.exit(0);
});
