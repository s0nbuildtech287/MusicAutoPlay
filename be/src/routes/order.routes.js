const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const { validateBody } = require('../middlewares/validate.middleware');

const router = Router();

router.get('/', orderController.getOrders);
router.post('/', validateBody(['videoId']), orderController.createOrder);

module.exports = router;

