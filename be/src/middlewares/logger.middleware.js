const logger = require('../utils/logger');

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const color = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    logger.info(`${method} ${originalUrl} ${color}${statusCode}\x1b[0m - ${duration}ms (${ip})`);
  });

  next();
};

module.exports = loggerMiddleware;
