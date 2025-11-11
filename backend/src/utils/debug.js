// Minimal backend debug utility
// Usage: const { isDebug, debug, warn, error } = require('./utils/debug');
// if (isDebug()) debug('api', 'Fetching /users', { id });

const isDebug = () => process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';

const prefix = (ns) => `[${ns}]`;

const debug = (ns, ...args) => {
  if (isDebug()) {
    // eslint-disable-next-line no-console
    console.log(prefix(ns), ...args);
  }
};

const warn = (ns, ...args) => {
  if (isDebug()) {
    // eslint-disable-next-line no-console
    console.warn(prefix(ns), ...args);
  }
};

const error = (ns, ...args) => {
  if (isDebug()) {
    // eslint-disable-next-line no-console
    console.error(prefix(ns), ...args);
  }
};

module.exports = { isDebug, debug, warn, error };
