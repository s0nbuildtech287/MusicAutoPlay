const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const envConfig = require('../config/env.config');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  logger.error(`${req.method} ${req.originalUrl} - ${error.message}`, error);

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    timestamp: new Date().toISOString(),
    ...(envConfig.isProduction ? {} : { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
