const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Validate YouTube video ID (11 alphanumeric chars + - _)
function isValidVideoId(id) {
  return /^[\w-]{11}$/.test(id);
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
    // Build yt-dlp arguments
    const args = [
      '-f', 'bestaudio/best/worstaudio/worst',
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      '--no-check-certificates',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '-o', '-',
      url
    ];
    
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
