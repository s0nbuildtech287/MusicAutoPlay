const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const filename = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const filepath = path.join(__dirname, filename);

// Check if already exists and is valid (not 0 bytes)
if (fs.existsSync(filepath)) {
  const stats = fs.statSync(filepath);
  if (stats.size > 0) {
    console.log(`✓ ${filename} already exists (${(stats.size / 1024 / 1024).toFixed(1)} MB), skipping download`);
    process.exit(0);
  } else {
    console.log(`⚠ ${filename} exists but is empty, re-downloading...`);
    fs.unlinkSync(filepath);
  }
}

console.log(`Downloading ${filename}...`);

const url = isWindows
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

// Follow redirects (GitHub uses multiple redirects)
function download(downloadUrl, redirectCount) {
  if (redirectCount > 10) {
    console.error('✗ Too many redirects');
    process.exit(1);
  }

  const client = downloadUrl.startsWith('https') ? https : http;

  client.get(downloadUrl, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
      const redirectUrl = response.headers.location;
      console.log(`  ↳ Redirecting (${response.statusCode})...`);
      response.resume(); // consume response to free memory
      download(redirectUrl, redirectCount + 1);
      return;
    }

    if (response.statusCode !== 200) {
      console.error(`✗ Download failed with status ${response.statusCode}`);
      process.exit(1);
    }

    const file = fs.createWriteStream(filepath);
    response.pipe(file);

    file.on('finish', () => {
      file.close(() => {
        const stats = fs.statSync(filepath);
        if (stats.size < 1000) {
          console.error(`✗ Downloaded file is too small (${stats.size} bytes), likely not valid`);
          fs.unlinkSync(filepath);
          process.exit(1);
        }
        if (!isWindows) {
          fs.chmodSync(filepath, 0o755);
        }
        console.log(`✓ ${filename} downloaded successfully! (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
      });
    });

    file.on('error', (err) => {
      fs.unlinkSync(filepath);
      console.error(`✗ Write error:`, err.message);
      process.exit(1);
    });
  }).on('error', (err) => {
    console.error(`✗ Failed to download ${filename}:`, err.message);
    console.log('Please download manually from: https://github.com/yt-dlp/yt-dlp/releases');
    process.exit(1);
  });
}

download(url, 0);
