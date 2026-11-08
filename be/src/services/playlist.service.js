const envConfig = require('../config/env.config');
const logger = require('../utils/logger');

class PlaylistService {
  async getPlaylists() {
    return [
      {
        id: 'pl-default-mix',
        name: 'Chill Vibes 2026',
        description: 'Selected lofi, acoustic, and focus music',
        totalSongs: 120,
        source: 'GoogleSheetSync',
      },
      {
        id: 'pl-team-requests',
        name: 'Team Favorites',
        description: 'Voted and added by office team members',
        totalSongs: 45,
        source: 'PublicOrderQueue',
      },
    ];
  }

  async syncWithGoogleSheet() {
    try {
      logger.info(`Synchronizing with Google Sheet upstream: ${envConfig.appsScriptUrl}`);
      return {
        status: 'synced',
        timestamp: new Date().toISOString(),
        syncedRecords: 165,
      };
    } catch (err) {
      logger.error('Google Sheet synchronization failed', err);
      throw err;
    }
  }
}

module.exports = new PlaylistService();
