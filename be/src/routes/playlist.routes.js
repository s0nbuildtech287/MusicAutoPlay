const { Router } = require('express');
const playlistController = require('../controllers/playlist.controller');

const router = Router();

router.get('/', playlistController.listPlaylists);
router.post('/sync', playlistController.syncCloud);

module.exports = router;

