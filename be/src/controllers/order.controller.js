const orderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

class OrderController {
  async getOrders(req, res, next) {
    try {
      const orders = await orderService.getOrderQueue();
      return ApiResponse.success(res, { orders }, SYSTEM_MESSAGES.ORDER.FETCHED);
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      const result = await orderService.submitOrder(req.body);
      return ApiResponse.created(res, result, SYSTEM_MESSAGES.ORDER.CREATED);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();

