const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

class StreamService {
  buildYtdlpArgs(url, attempt = 1) {
    const args = [
      '-f', 'bestaudio/best',
      '--no-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '--extractor-retries', '3',
      '--retry-sleep', 'linear=1::3',
      '--socket-timeout', '15',
    ];

    if (attempt === 1) {
      args.push('--extractor-args', 'youtube:player_client=android');
    } else if (attempt === 2) {
      args.push('--extractor-args', 'youtube:player_client=android;player_skip=webpage,configs');
    } else {
      args.push('--extractor-args', 'youtube:player_client=ios');
    }

    args.push('-o', '-', url);
    return args;
  }

  resolveBinaryPath() {
    const isWindows = os.platform() === 'win32';
    // Check root folder fallback or global binary
    const localExe = path.resolve(__dirname, '../../../', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
    return localExe;
  }

  createAudioPipeline(videoId, attempt = 1) {
    const binary = this.resolveBinaryPath();
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const args = this.buildYtdlpArgs(url, attempt);

    logger.info(`Spawning audio extractor for [${videoId}] attempt #${attempt}`);
    const processInstance = spawn(binary, args);

    return processInstance;
  }
}

module.exports = new StreamService();

