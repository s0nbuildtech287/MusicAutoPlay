const songService = require('../services/song.service');
const ApiResponse = require('../utils/apiResponse');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

class SongController {
  async getSong(req, res, next) {
    try {
      const { id } = req.params;
      const metadata = await songService.getSongMetadata(id);
      return ApiResponse.success(res, metadata, SYSTEM_MESSAGES.SONG.FOUND);
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const { q, limit } = req.query;
      const results = await songService.searchSongs(q, limit ? parseInt(limit, 10) : 10);
      return ApiResponse.success(res, results, 'Search completed');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SongController();
