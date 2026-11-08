const ApiError = require('../utils/apiError');
const SYSTEM_MESSAGES = require('../constants/systemMessages');

class SongService {
  isValidVideoId(id) {
    return /^[\w-]{11}$/.test(id);
  }

  async getSongMetadata(videoId) {
    if (!this.isValidVideoId(videoId)) {
      throw ApiError.badRequest(SYSTEM_MESSAGES.SONG.INVALID_ID);
    }

    return {
      videoId,
      title: 'Auto Extracted Song Title',
      artist: 'Verified YouTube Artist',
      durationSeconds: 240,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      streamUrl: `/api/v1/stream?id=${videoId}`,
    };
  }

  async searchSongs(query, limit = 10) {
    if (!query) return [];

    return [
      {
        videoId: 'dQw4w9WgXcQ',
        title: `Search Result for: ${query}`,
        artist: 'MyMusic Studio Audio Network',
        durationSeconds: 212,
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      },
    ];
  }
}

module.exports = new SongService();

