const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const filename = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const filepath = path.join(__dirname, filename);

// Check if already exists
if (fs.existsSync(filepath)) {
  console.log(`✓ ${filename} already exists, skipping download`);
  process.exit(0);
}

console.log(`Downloading ${filename}...`);

const url = isWindows
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

https.get(url, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // Follow redirect
    https.get(response.headers.location, (res) => {
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        if (!isWindows) {
          fs.chmodSync(filepath, 0o755);
        }
        console.log(`✓ ${filename} downloaded successfully!`);
      });
    });
  } else {
    const file = fs.createWriteStream(filepath);
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      if (!isWindows) {
        fs.chmodSync(filepath, 0o755);
      }
      console.log(`✓ ${filename} downloaded successfully!`);
    });
  }
}).on('error', (err) => {
  console.error(`✗ Failed to download ${filename}:`, err.message);
  console.log('Please download manually from: https://github.com/yt-dlp/yt-dlp/releases');
  process.exit(1);
});
