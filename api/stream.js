const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Detect FFmpeg availability for universal audio transcoding (MP3 for iOS Safari / Android / PC)
let ffmpegPath = null;
try {
  if (os.platform() === 'win32') {
    execSync('where ffmpeg', { stdio: 'ignore' });
    ffmpegPath = 'ffmpeg';
  } else {
    execSync('which ffmpeg', { stdio: 'ignore' });
    ffmpegPath = fs.existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : 'ffmpeg';
  }
} catch {
  ffmpegPath = null;
}

console.log(`[StreamEngine] Transcoder: ${ffmpegPath ? `FFmpeg MP3 (Universal iOS/Android/PC at ${ffmpegPath})` : 'Direct WebM Fallback'}`);

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
      let ffmpeg = null;
      let stderrBuf = '';
      let cleaned = false;

      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        try { ytdlp.kill('SIGKILL'); } catch {}
        if (ffmpeg) {
          try { ffmpeg.kill('SIGKILL'); } catch {}
        }
      };

      req.on('close', cleanup);
      res.on('finish', cleanup);

      ytdlp.stderr.on('data', (data) => {
        stderrBuf += data.toString();
        if (stderrBuf.includes('403') || stderrBuf.includes('Forbidden')) {
          console.warn(`[Stream] 403 on attempt ${attempt}: ${id}`);
        }
      });

      ytdlp.on('error', (err) => {
        console.error(`[Stream] yt-dlp error on attempt ${attempt}:`, err.message);
        cleanup();
        if (!res.headersSent && attempt === MAX_ATTEMPTS) {
          res.status(500).json({ error: 'Failed to start yt-dlp' });
        }
      });

      // Wait a moment to see if yt-dlp exits immediately
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (ytdlp.exitCode !== null && ytdlp.exitCode !== 0) {
        console.warn(`[Stream] Attempt ${attempt} failed (exit ${ytdlp.exitCode}), ${attempt < MAX_ATTEMPTS ? 'retrying...' : 'giving up'}`);
        cleanup();
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
        return res.status(502).json({ error: `yt-dlp failed after ${MAX_ATTEMPTS} attempts`, detail: stderrBuf.slice(-300) });
      }

      // If FFmpeg is available, transcode to high-quality MP3 for universal compatibility (iOS/iPhone, Android, PC)
      if (ffmpegPath) {
        ffmpeg = spawn(ffmpegPath, [
          '-i', 'pipe:0',
          '-vn',
          '-c:a', 'libmp3lame',
          '-b:a', '192k',
          '-f', 'mp3',
          'pipe:1',
        ]);

        // Prevent unhandled EPIPE crashes
        ytdlp.stdout.on('error', () => {});
        ffmpeg.stdin.on('error', () => {});
        ffmpeg.stdout.on('error', () => {});
        ffmpeg.stderr.on('data', () => {});

        ffmpeg.on('error', (err) => {
          console.error('[Stream] FFmpeg error:', err.message);
          cleanup();
        });

        ytdlp.stdout.pipe(ffmpeg.stdin);

        if (!res.headersSent) {
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Transfer-Encoding', 'chunked');
          res.setHeader('Cache-Control', 'no-cache, no-store');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }

        ffmpeg.stdout.pipe(res);

      } else {
        // Direct WebM fallback
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'audio/webm');
          res.setHeader('Transfer-Encoding', 'chunked');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        ytdlp.stdout.pipe(res);
      }

      ytdlp.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`[Stream] yt-dlp closed with code ${code} on attempt ${attempt}`);
        } else {
          console.log(`[Stream] Done: ${id} (attempt ${attempt})`);
        }
      });

      return; // success — exit loop

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
