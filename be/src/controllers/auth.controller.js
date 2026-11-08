const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.authenticateUser(username, password);
      return ApiResponse.success(res, result, SYSTEM_MESSAGES.AUTH.LOGIN_SUCCESS);
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const result = await authService.registerUser(req.body);
      return ApiResponse.created(res, result, SYSTEM_MESSAGES.AUTH.REGISTER_SUCCESS);
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      return ApiResponse.success(res, { user: req.user }, 'Profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();

