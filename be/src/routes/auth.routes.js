const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');

const router = Router();

router.post('/login', validateBody(['username', 'password']), authController.login);
router.post('/register', validateBody(['username', 'password']), authController.register);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
