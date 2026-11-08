const formatTime = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    console.log(`\x1b[36m[INFO]\x1b[0m [${formatTime()}] ${message}`, Object.keys(meta).length ? meta : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`\x1b[33m[WARN]\x1b[0m [${formatTime()}] ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, error = null) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m [${formatTime()}] ${message}`, error ? error.stack || error : '');
  },
  success: (message) => {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m [${formatTime()}] ${message}`);
  },
};

module.exports = logger;

