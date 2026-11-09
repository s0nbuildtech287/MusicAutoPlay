const express = require('express');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const streamHandler = require('./api/stream');

const app = express();
const PORT = 8888;
const ORDER_PUBLIC_URL = process.env.ORDER_PUBLIC_URL || 'https://script.google.com/macros/s/AKfycbwW1hNIHd5ck7xf_EQ407AWgikYELJqdqgOf0rQsIRUDPWTm51N2eevMLMPcCAkPO0Z0g/exec';

// In-memory cache for track durations (seconds)
const durationCache = new Map();

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve people photos
app.use('/people', express.static(path.join(__dirname, 'people')));

// Route /api/stream → our handler
app.get('/api/stream', streamHandler);

// Route /api/duration?id=... → fetches accurate track duration in seconds
app.get('/api/duration', async (req, res) => {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ duration: 0 });

  if (durationCache.has(id)) {
    return res.json({ duration: durationCache.get(id) });
  }

  // Fast path: fetch YouTube watch page HTML and parse lengthSeconds (~200ms)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi,en;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (response.ok) {
      const html = await response.text();
      const match = html.match(/"lengthSeconds":"(\d+)"/);
      if (match && match[1]) {
        const sec = parseInt(match[1], 10);
        if (sec > 0) {
          durationCache.set(id, sec);
          return res.json({ duration: sec });
        }
      }
    }
  } catch (_) {
    // Ignore and fallback to yt-dlp
  }

  // Fallback path: yt-dlp --print duration
  try {
    const isWindows = os.platform() === 'win32';
    const ytdlpPath = path.join(__dirname, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
    const child = spawn(ytdlpPath, [
      '--print', 'duration',
      '--no-playlist',
      '--no-warnings',
      '--socket-timeout', '8',
      `https://www.youtube.com/watch?v=${id}`
    ]);
    let out = '';
    const killTimer = setTimeout(() => { try { child.kill(); } catch (_) {} }, 9000);
    child.stdout.on('data', d => { out += d.toString(); });
    child.on('close', () => {
      clearTimeout(killTimer);
      const sec = parseFloat(out.trim());
      if (!isNaN(sec) && sec > 0) {
        const rounded = Math.round(sec);
        durationCache.set(id, rounded);
        return res.json({ duration: rounded });
      }
      res.json({ duration: 0 });
    });
    child.on('error', () => {
      clearTimeout(killTimer);
      res.json({ duration: 0 });
    });
  } catch (_) {
    res.json({ duration: 0 });
  }
});

// Proxy the public order Apps Script through Express to avoid browser CORS errors.
app.get('/api/orders', async (req, res) => {
  try {
    const target = new URL(ORDER_PUBLIC_URL);
    target.searchParams.set('action', 'list');
    target.searchParams.set('t', Date.now().toString());
    const upstream = await fetch(target, { cache: 'no-store' });
    const text = await upstream.text();
    if (!upstream.ok) return res.status(upstream.status).type('application/json').send(text);
    try {
      JSON.parse(text);
      res.type('application/json').send(text);
    } catch {
      // Apps Script can return an HTML error page when its deployment is invalid.
      res.json({ orders: [], error: 'Order Apps Script did not return JSON. Check the deployment URL.' });
    }
  } catch (error) {
    res.status(502).json({ error: 'Order Apps Script connection failed', orders: [] });
  }
});

// These routes keep the legacy order controls from falling through to index.html.
app.get('/api/order-status', (req, res) => res.json({ enabled: false }));
app.post('/api/order-toggle', (req, res) => res.json({ enabled: Boolean(req.body && req.body.enabled) }));
app.post('/api/orders/next', (req, res) => res.json({ nextSong: null }));

// All other routes → index.html
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎵 Company Music Player running at http://localhost:${PORT}\n`);
});
