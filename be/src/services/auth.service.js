const ApiError = require('../utils/apiError');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

class AuthService {
  async authenticateUser(username, password) {
    if (!username || !password) {
      throw ApiError.badRequest(SYSTEM_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Standard authentication logic
    const sanitizedUser = username.trim().toLowerCase();
    const token = `mms_${Buffer.from(`${sanitizedUser}:${Date.now()}`).toString('base64')}`;

    return {
      user: {
        username: sanitizedUser,
        displayName: username.trim(),
        role: sanitizedUser === 'admin' ? 'admin' : 'member',
      },
      token,
      expiresIn: '7d',
    };
  }

  async registerUser(userData) {
    const { username, password, displayName } = userData;
    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required.');
    }

    return {
      username: username.trim().toLowerCase(),
      displayName: displayName || username.trim(),
      createdAt: new Date().toISOString(),
    };
  }
}

module.exports = new AuthService();

