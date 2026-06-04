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
  console.log(`[Stream] Binary path: ${ytdlpPath}`);

  try {
    // Spawn yt-dlp process with more options
    const ytdlp = spawn(ytdlpPath, [
      '-f', 'bestaudio/best',
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      '--no-check-certificates',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '--extractor-retries', '3',
      '--socket-timeout', '30',
      '-o', '-',  // Output to stdout
      url
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let hasData = false;

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe stdout to response
    ytdlp.stdout.on('data', (chunk) => {
      hasData = true;
    });
    
    ytdlp.stdout.pipe(res);

    // Collect and log errors
    let stderrData = '';
    ytdlp.stderr.on('data', (data) => {
      stderrData += data.toString();
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
        console.error(`[Stream] Full stderr: ${stderrData}`);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: `yt-dlp failed with code ${code}`,
            details: stderrData.slice(0, 500)
          });
        }
      } else if (!hasData) {
        console.warn(`[Stream] No data received for ${id}`);
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
