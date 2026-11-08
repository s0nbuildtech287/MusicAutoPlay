const ApiError = require('../utils/apiError');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized(SYSTEM_MESSAGES.AUTH.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    // In production with jsonwebtoken: jwt.verify(token, envConfig.jwtSecret)
    if (!token || token === 'undefined') {
      return next(ApiError.unauthorized(SYSTEM_MESSAGES.AUTH.UNAUTHORIZED));
    }

    req.user = {
      username: 'active_session',
      role: 'member',
    };

    next();
  } catch (error) {
    return next(ApiError.unauthorized(SYSTEM_MESSAGES.AUTH.UNAUTHORIZED));
  }
};

module.exports = { verifyToken };

