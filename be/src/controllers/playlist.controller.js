const playlistService = require('../services/playlist.service');
const ApiResponse = require('../utils/apiResponse');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

class PlaylistController {
  async listPlaylists(req, res, next) {
    try {
      const playlists = await playlistService.getPlaylists();
      return ApiResponse.success(res, playlists, SYSTEM_MESSAGES.PLAYLIST.FETCHED);
    } catch (err) {
      next(err);
    }
  }

  async syncCloud(req, res, next) {
    try {
      const syncResult = await playlistService.syncWithGoogleSheet();
      return ApiResponse.success(res, syncResult, SYSTEM_MESSAGES.PLAYLIST.SYNCED);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlaylistController();
