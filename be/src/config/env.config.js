const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envConfig = {
  port: parseInt(process.env.PORT, 10) || 8888,
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://chillmusic.click,https://www.chillmusic.click')
    .split(',')
    .map(o => o.trim()),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_music_studio',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  appsScriptUrl: process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwW1hNIHd5ck7xf_EQ407AWgikYELJqdqgOf0rQsIRUDPWTm51N2eevMLMPcCAkPO0Z0g/exec',
  ytdlpBinary: process.env.YTDLP_BINARY_PATH || 'yt-dlp',
  audioQuality: process.env.AUDIO_QUALITY || 'bestaudio/best',
};

module.exports = envConfig;
