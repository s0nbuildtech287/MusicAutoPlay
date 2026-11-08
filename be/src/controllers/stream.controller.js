const streamService = require('../services/stream.service');
const songService = require('../services/song.service');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class StreamController {
  async handleStream(req, res, next) {
    const { id } = req.query;

    if (!id || !songService.isValidVideoId(id)) {
      return next(ApiError.badRequest('Invalid or missing YouTube video ID parameter'));
    }

    try {
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const ytdlpProcess = streamService.createAudioPipeline(id);

      ytdlpProcess.stdout.pipe(res);

      req.on('close', () => {
        logger.info(`Client disconnected stream [${id}] - terminating subprocess`);
        try {
          ytdlpProcess.kill('SIGKILL');
        } catch {}
      });

      ytdlpProcess.stderr.on('data', data => {
        const text = data.toString();
        if (text.includes('ERROR:')) {
          logger.warn(`yt-dlp stderr: ${text.slice(0, 150)}`);
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StreamController();
