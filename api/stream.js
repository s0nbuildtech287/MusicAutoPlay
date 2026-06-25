const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Validate YouTube video ID (11 alphanumeric chars + - _)
function isValidVideoId(id) {
  return /^[\w-]{11}$/.test(id);
}

function buildArgs(url, attempt) {
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

async function tryStream(ytdlpPath, url, attempt) {
  return new Promise((resolve, reject) => {
    const args = buildArgs(url, attempt);
    const proc = spawn(ytdlpPath, args);
    let stderrBuf = '';

    proc.stderr.on('data', d => {
      stderrBuf += d.toString();
    });

    proc.on('error', err => reject(err));

    // Resolve early with the process so we can pipe stdout
    // but watch for quick exit with error
    const timer = setTimeout(() => resolve({ proc, stderrBuf: () => stderrBuf }), 400);

    proc.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`yt-dlp exit ${code}: ${stderrBuf.slice(-300)}`));
      }
    });
  });
}

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || !isValidVideoId(id)) {
    return res.status(400).json({ error: 'Invalid or missing video ID' });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;
  const isWindows = os.platform() === 'win32';
  const ytdlpPath = path.join(__dirname, '..', isWindows ? 'yt-dlp.exe' : 'yt-dlp');

  console.log(`[Stream] Fetching: ${url}`);

  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const args = buildArgs(url, attempt);
      const ytdlp = spawn(ytdlpPath, args);
      let stderrBuf = '';
      let headersSent = false;
      let failed = false;

      ytdlp.stderr.on('data', (data) => {
        stderrBuf += data.toString();
        // Log 403 early so we know to retry
        if (stderrBuf.includes('403') || stderrBuf.includes('Forbidden')) {
          console.warn(`[Stream] 403 on attempt ${attempt}: ${id}`);
        }
      });

      ytdlp.on('error', (err) => {
        failed = true;
        console.error(`[Stream] Process error attempt ${attempt}:`, err.message);
        if (!res.headersSent) {
          if (attempt < MAX_ATTEMPTS) return; // will retry in outer loop via close handler
          res.status(500).json({ error: 'Failed to start yt-dlp' });
        }
      });

      // Wait a moment to see if yt-dlp exits immediately (error) before piping
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (ytdlp.exitCode !== null && ytdlp.exitCode !== 0) {
        console.warn(`[Stream] Attempt ${attempt} failed (exit ${ytdlp.exitCode}), ${attempt < MAX_ATTEMPTS ? 'retrying...' : 'giving up'}`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
        return res.status(502).json({ error: `yt-dlp failed after ${MAX_ATTEMPTS} attempts`, detail: stderrBuf.slice(-300) });
      }

      // Looks good — start piping
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'audio/webm');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');
        headersSent = true;
      }

      ytdlp.stdout.pipe(res);

      ytdlp.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`[Stream] yt-dlp closed with code ${code} on attempt ${attempt}`);
        } else {
          console.log(`[Stream] Done: ${id} (attempt ${attempt})`);
        }
      });

      req.on('close', () => {
        console.log(`[Stream] Client disconnected: ${id}`);
        ytdlp.kill();
      });

      return; // success — exit retry loop

    } catch (err) {
      console.warn(`[Stream] Attempt ${attempt} error: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 500 * attempt));
      } else {
        if (!res.headersSent) {
          res.status(502).json({ error: `Stream failed after ${MAX_ATTEMPTS} attempts`, detail: err.message });
        }
      }
    }
  }
};
