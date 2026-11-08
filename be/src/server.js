const app = require('./app');
const envConfig = require('./config/env.config');
const logger = require('./utils/logger');

const server = app.listen(envConfig.port, () => {
  logger.success(`🚀 MyMusic Studio API Gateway running on port ${envConfig.port}`);
  logger.info(`Environment: [${envConfig.env.toUpperCase()}]`);
  logger.info(`Health check: http://localhost:${envConfig.port}${envConfig.apiPrefix}/health`);
});

// Graceful Process Termination Handlers
const gracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown sequence...`);
  server.close(() => {
    logger.info('HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10s timeout
  setTimeout(() => {
    logger.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception occurred:', error);
  process.exit(1);
});

