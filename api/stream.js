const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { EventEmitter } = require('events');

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

// Cache directory on disk for completed MP3 files
const CACHE_DIR = path.join(__dirname, '..', 'audio-cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Active jobs to avoid duplicate download & transcode processes
const activeJobs = new Map();

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

async function handleStream(req, res) {
  const { id } = req.query;

  if (!id || !isValidVideoId(id)) {
    return res.status(400).json({ error: 'Invalid or missing video ID' });
  }

  const cacheFile = path.join(CACHE_DIR, `${id}.mp3`);

  // 1. If audio file already exists in cache with valid size (>50KB),
  // serve it with native HTTP 206 Partial Content (Range requests) for iOS / Android / PC
  if (fs.existsSync(cacheFile)) {
    try {
      const stat = fs.statSync(cacheFile);
      if (stat.size > 50000) {
        return res.sendFile(cacheFile, {
          acceptRanges: true,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
    } catch (_) {}
  }

  // 2. If a transcode job is already running for this video ID, wait for completion
  if (activeJobs.has(id)) {
    const job = activeJobs.get(id);
    const onDone = () => {
      if (fs.existsSync(cacheFile)) {
        res.sendFile(cacheFile, {
          acceptRanges: true,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          }
        });
      } else {
        if (!res.headersSent) res.status(502).json({ error: 'Cache transcode failed' });
      }
    };
    job.once('done', onDone);
    job.once('error', (err) => {
      if (!res.headersSent) res.status(502).json({ error: err.message || 'Stream error' });
    });
    req.on('close', () => job.removeListener('done', onDone));
    return;
  }

  // 3. Start a new download & transcode job
  const job = new EventEmitter();
  activeJobs.set(id, job);

  const url = `https://www.youtube.com/watch?v=${id}`;
  const isWindows = os.platform() === 'win32';
  const ytdlpPath = path.join(__dirname, '..', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  const tempFile = path.join(CACHE_DIR, `${id}.mp3.tmp`);
  let fileStream = null;

  console.log(`[Stream] Fetching: ${url}`);

  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const args = buildArgs(url, attempt);
      const ytdlp = spawn(ytdlpPath, args);
      let ffmpeg = null;
      let stderrBuf = '';
      let cleaned = false;

      const cleanupProcesses = () => {
        if (cleaned) return;
        cleaned = true;
        try { ytdlp.kill('SIGKILL'); } catch {}
        if (ffmpeg) {
          try { ffmpeg.kill('SIGKILL'); } catch {}
        }
        try { if (fileStream) fileStream.destroy(); } catch {}
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
        activeJobs.delete(id);
      };

      ytdlp.stderr.on('data', (data) => {
        stderrBuf += data.toString();
        if (stderrBuf.includes('403') || stderrBuf.includes('Forbidden')) {
          console.warn(`[Stream] 403 on attempt ${attempt}: ${id}`);
        }
      });

      ytdlp.on('error', (err) => {
        console.error(`[Stream] yt-dlp error on attempt ${attempt}:`, err.message);
        cleanupProcesses();
        job.emit('error', err);
        if (!res.headersSent && attempt === MAX_ATTEMPTS) {
          res.status(500).json({ error: 'Failed to start yt-dlp' });
        }
      });

      // Wait a moment to see if yt-dlp exits immediately
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (ytdlp.exitCode !== null && ytdlp.exitCode !== 0) {
        console.warn(`[Stream] Attempt ${attempt} failed (exit ${ytdlp.exitCode}), ${attempt < MAX_ATTEMPTS ? 'retrying...' : 'giving up'}`);
        cleanupProcesses();
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
        job.emit('error', new Error('yt-dlp failed'));
        return res.status(502).json({ error: `yt-dlp failed after ${MAX_ATTEMPTS} attempts`, detail: stderrBuf.slice(-300) });
      }

      // If FFmpeg is available, transcode to high-quality MP3 and write to disk cache + client simultaneously
      if (ffmpegPath) {
        ffmpeg = spawn(ffmpegPath, [
          '-i', 'pipe:0',
          '-vn',
          '-c:a', 'libmp3lame',
          '-b:a', '192k',
          '-f', 'mp3',
          'pipe:1',
        ]);

        fileStream = fs.createWriteStream(tempFile);

        // Prevent unhandled EPIPE crashes
        ytdlp.stdout.on('error', () => {});
        ffmpeg.stdin.on('error', () => {});
        ffmpeg.stdout.on('error', () => {});
        ffmpeg.stderr.on('data', () => {});
        fileStream.on('error', () => {});

        ffmpeg.on('error', (err) => {
          console.error('[Stream] FFmpeg error:', err.message);
          cleanupProcesses();
          job.emit('error', err);
        });

        ytdlp.stdout.pipe(ffmpeg.stdin);

        if (!res.headersSent) {
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Transfer-Encoding', 'chunked');
          res.setHeader('Cache-Control', 'no-cache, no-store');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }

        // Pipe to live client response AND to temporary cache file
        ffmpeg.stdout.pipe(res);
        ffmpeg.stdout.pipe(fileStream);

        ffmpeg.on('close', (code) => {
          if (fileStream) {
            fileStream.end(() => {
              if (code === 0 && fs.existsSync(tempFile) && fs.statSync(tempFile).size > 50000) {
                try {
                  fs.renameSync(tempFile, cacheFile);
                  console.log(`[Stream] Cached to disk: ${id}.mp3 (${Math.round(fs.statSync(cacheFile).size / 1024)} KB)`);
                  job.emit('done');
                } catch (e) {
                  job.emit('error', e);
                }
              } else {
                try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (_) {}
                job.emit('error', new Error(`FFmpeg exited with code ${code}`));
              }
              activeJobs.delete(id);
            });
          }
        });

      } else {
        // Direct WebM fallback
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'audio/webm');
          res.setHeader('Transfer-Encoding', 'chunked');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        ytdlp.stdout.pipe(res);
        activeJobs.delete(id);
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
        activeJobs.delete(id);
        job.emit('error', err);
        if (!res.headersSent) {
          res.status(502).json({ error: `Stream failed after ${MAX_ATTEMPTS} attempts`, detail: err.message });
        }
      }
    }
  }
}

module.exports = handleStream;
module.exports.CACHE_DIR = CACHE_DIR;
