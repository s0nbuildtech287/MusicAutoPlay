const { Router } = require('express');
const streamController = require('../controllers/stream.controller');

const router = Router();

router.get('/', streamController.handleStream);

module.exports = router;

