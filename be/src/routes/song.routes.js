const { Router } = require('express');
const songController = require('../controllers/song.controller');

const router = Router();

router.get('/search', songController.search);
router.get('/:id', songController.getSong);

module.exports = router;
