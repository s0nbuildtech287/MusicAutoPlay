const ApiError = require('../utils/apiError');

const validateBody = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return next(ApiError.badRequest(`Missing required fields: ${missing.join(', ')}`));
    }

    next();
  };
};

const validateQuery = (requiredParams = []) => {
  return (req, res, next) => {
    const missing = [];
    for (const param of requiredParams) {
      if (!req.query[param]) {
        missing.push(param);
      }
    }

    if (missing.length > 0) {
      return next(ApiError.badRequest(`Missing required query parameters: ${missing.join(', ')}`));
    }

    next();
  };
};

module.exports = { validateBody, validateQuery };
