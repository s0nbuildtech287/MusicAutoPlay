const ApiResponse = require('../utils/apiResponse');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

class HealthController {
  check(req, res) {
    const healthData = {
      status: 'UP',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
    };
    return ApiResponse.success(res, healthData, SYSTEM_MESSAGES.SERVER.SERVICE_HEALTHY);
  }
}

module.exports = new HealthController();

