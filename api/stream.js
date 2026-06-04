const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');

// Validate YouTube video ID (11 alphanumeric chars + - _)
function isValidVideoId(id) {
  return /^[\w-]{11}$/.test(id);
}

// Download cookies from URL (for Render deployment)
async function ensureCookies() {
  const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
  
  // If cookies already exist, skip
  if (fs.existsSync(cookiesPath)) {
    console.log('[Stream] Using existing cookies file');
    // Read first few lines to verify format
    const preview = fs.readFileSync(cookiesPath, 'utf8').split('\n').slice(0, 3).join('\n');
    console.log('[Stream] Cookies preview:', preview.slice(0, 200) + '...');
    return cookiesPath;
  }
  
  // Check if COOKIES_URL env var is set
  const cookiesUrl = process.env.COOKIES_URL;
  if (!cookiesUrl) {
    console.log('[Stream] No cookies configured (OK for local dev)');
    return null;
  }
  
  // Download cookies
  return new Promise((resolve, reject) => {
    console.log('[Stream] Downloading cookies from URL...');
    https.get(cookiesUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download cookies: ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(cookiesPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('[Stream] Cookies downloaded successfully');
        
        // Verify cookies format
        const content = fs.readFileSync(cookiesPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        console.log(`[Stream] Cookies file has ${lines.length} valid entries`);
        
        if (lines.length === 0) {
          reject(new Error('Cookies file is empty or invalid'));
          return;
        }
        
        resolve(cookiesPath);
      });
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || !isValidVideoId(id)) {
    return res.status(400).json({ error: 'Invalid or missing video ID' });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;
  
  // Use different binary based on OS
  const isWindows = os.platform() === 'win32';
  const ytdlpPath = path.join(__dirname, '..', isWindows ? 'yt-dlp.exe' : 'yt-dlp');

  console.log(`[Stream] Fetching: ${url}`);

  try {
    // Ensure cookies are available (download if needed)
    const cookiesPath = await ensureCookies();
    
    // Build yt-dlp arguments
    const args = [
      '-f', 'bestaudio/best/worstaudio/worst',
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      '--no-check-certificates',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ];
    
    // Add cookies if available
    if (cookiesPath) {
      args.push('--cookies', cookiesPath);
      console.log('[Stream] Using cookies for authentication');
    }
    
    // Add output and URL at the end
    args.push('-o', '-', url);
    
    // Spawn yt-dlp process
    const ytdlp = spawn(ytdlpPath, args);

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe stdout to response
    ytdlp.stdout.pipe(res);

    // Log errors
    ytdlp.stderr.on('data', (data) => {
      console.error(`[Stream] yt-dlp stderr: ${data}`);
    });

    ytdlp.on('error', (err) => {
      console.error(`[Stream] Process error:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start yt-dlp', message: err.message });
      }
    });

    ytdlp.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Stream] yt-dlp exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({ error: `yt-dlp failed with code ${code}` });
        }
      }
    });

    req.on('close', () => {
      console.log(`[Stream] Client disconnected: ${id}`);
      ytdlp.kill();
    });

  } catch (err) {
    console.error('[Stream] Fatal error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
};
