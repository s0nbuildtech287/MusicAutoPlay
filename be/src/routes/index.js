const { Router } = require('express');
const authRoutes = require('./auth.routes');
const songRoutes = require('./song.routes');
const playlistRoutes = require('./playlist.routes');
const orderRoutes = require('./order.routes');
const streamRoutes = require('./stream.routes');
const healthRoutes = require('./health.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/songs', songRoutes);
router.use('/playlists', playlistRoutes);
router.use('/orders', orderRoutes);
router.use('/stream', streamRoutes);
router.use('/health', healthRoutes);

module.exports = router;

