const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let server;
let remoteOrderSyncTimer;
const ORDER_WEBAPP_URL = process.env.LOTUSQUANT_ORDER_WEBAPP_URL?.trim() || 'https://script.google.com/macros/s/AKfycbwW1hNIHd5ck7xf_EQ407AWgikYELJqdqgOf0rQsIRUDPWTm51N2eevMLMPcCAkPO0Z0g/exec';

// Validate YouTube video ID
function isValidVideoId(id) {
  return /^[\w-]{11}$/.test(id);
}

// Order state
let orderQueue = [];
let currentPlayingUser = null;
let consecutiveCount = 0;
let orderEnabled = true; // Mirrored from Apps Script; default open until remote state is known.
let orderEnabledSynced = false;
let orderEnabledSyncPromise = null;
const completedRemoteOrderIds = new Set();

function isFallbackOrderTitle(title) {
  const text = String(title || '').trim();
  return !text || /^Y[eê]u c[aầ]u nh[aạ]c/i.test(text) || /^Đang tải thông tin bài hát/i.test(text);
}

function resolveTitleWithYtDlp(cleanUrl, vid) {
  return new Promise((resolve) => {
    const isWindows = os.platform() === 'win32';
    const ytdlpPath = path.join(__dirname, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
    const { execFile } = require('child_process');

    execFile(ytdlpPath, ['--encoding', 'utf-8', '--js-runtimes', 'node', '--get-title', cleanUrl], { encoding: 'utf8' }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        return resolve(stdout.trim());
      }
      console.error('[Queue] Get title error:', err && err.message ? err.message : err);
      resolve(`Yeu cau nhac (${vid})`);
    });
  });
}

function getOrderWebAppApiUrl(action, params = {}) {
  const url = new URL(ORDER_WEBAPP_URL);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  url.searchParams.set('t', String(Date.now()));
  return url.toString();
}

async function readAppsScriptResponse(res) {
  const body = await res.text();
  let data = null;
  try {
    data = body ? JSON.parse(body) : null;
  } catch (_) {
    data = null;
  }
  return { body, data };
}

function normalizeOrderTimestamp(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeRemoteOrder(order) {
  const timestamp = order.timestamp || order.createdAt || '';
  return {
    id: String(order.id || '').trim(),
    name: String(order.name || '').trim(),
    url: String(order.url || '').trim(),
    vid: String(order.vid || '').trim(),
    title: String(order.title || '').trim(),
    status: String(order.status || 'pending').trim().toLowerCase(),
    note: String(order.note || '').trim(),
    timestamp,
    timestampMs: normalizeOrderTimestamp(timestamp),
    source: 'webapp',
  };
}

function normalizeLocalOrder(order) {
  return {
    ...order,
    source: 'local',
    timestampMs: normalizeOrderTimestamp(order.timestamp),
  };
}

async function markRemoteOrderDone(orderId) {
  const res = await fetch(getOrderWebAppApiUrl('done', { id: orderId }));
  const { body, data } = await readAppsScriptResponse(res);
  console.log(`[Orders] mark done ${orderId}: HTTP ${res.status} ${body}`);
  if (data && data.ok === false && ['Order not found', 'No rows'].includes(data.error)) {
    return { ok: true, deleted: false, missing: true };
  }
  if (!res.ok || !data || data.ok !== true) {
    throw new Error((data && data.error) || `HTTP ${res.status}`);
  }
  return data;
}

async function updateRemoteOrderTitle(orderId, title) {
  try {
    const res = await fetch(getOrderWebAppApiUrl('title', { id: orderId, title }));
    const body = await res.text();
    console.log(`[Orders] update title ${orderId}: HTTP ${res.status} ${body}`);
  } catch (err) {
    console.warn('[Orders] Failed to update remote order title:', err.message || err);
  }
}

async function updateRemoteOrderEnabled(enabled) {
  const res = await fetch(getOrderWebAppApiUrl('set-status', { enabled: enabled ? 'true' : 'false', key: 'lotusquant-order-admin-2026' }));
  const { body, data } = await readAppsScriptResponse(res);
  console.log(`[Order] sync remote enabled=${enabled}: HTTP ${res.status} ${body}`);
  if (!res.ok || !data || data.ok !== true) {
    throw new Error((data && data.error) || `HTTP ${res.status}`);
  }
  return data;
}

async function syncOrderEnabledFromRemote() {
  try {
    const res = await fetch(getOrderWebAppApiUrl('status'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.ok !== true || typeof data.enabled !== 'boolean') {
      throw new Error('Invalid order status response');
    }
    orderEnabled = data.enabled === true;
    orderEnabledSynced = true;
    console.log(`[Order] Synced order state from remote: ${orderEnabled ? 'ENABLED' : 'DISABLED'}`);
    return orderEnabled;
  } catch (err) {
    console.warn('[Order] Failed to sync order state from remote:', err.message || err);
    throw err;
  }
}

async function ensureOrderEnabledSynced() {
  if (orderEnabledSynced) return orderEnabled;
  if (!orderEnabledSyncPromise) {
    orderEnabledSyncPromise = syncOrderEnabledFromRemote().finally(() => {
      orderEnabledSyncPromise = null;
    });
  }
  return orderEnabledSyncPromise;
}

async function syncRemoteOrders() {
  try {
    const res = await fetch(getOrderWebAppApiUrl('list'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const remoteOrders = Array.isArray(data.orders) ? data.orders : [];
    const pendingRemoteOrders = remoteOrders
      .filter(order => String(order.status || 'pending').trim().toLowerCase() !== 'done')
      .map(normalizeRemoteOrder)
      .filter(order => order.id && !completedRemoteOrderIds.has(order.id));

    const localOrders = orderQueue.filter(order => order.source !== 'webapp').map(normalizeLocalOrder);
    const localIds = new Set(localOrders.map(order => order.id));
    const mergedRemoteOrders = pendingRemoteOrders.filter(order => !localIds.has(order.id));

    orderQueue = [...localOrders, ...mergedRemoteOrders].sort((a, b) => a.timestampMs - b.timestampMs);

    for (const order of orderQueue) {
      if (order.source !== 'webapp') continue;
      if (!isFallbackOrderTitle(order.title)) continue;
      if (!order.url || !order.vid) continue;

      const targetId = order.id;
      const cleanUrl = order.url;
      resolveTitleWithYtDlp(cleanUrl, order.vid).then((title) => {
        const idx = orderQueue.findIndex(item => item.id === targetId);
        if (idx !== -1 && isFallbackOrderTitle(orderQueue[idx].title)) {
          orderQueue[idx].title = title;
          console.log(`[Orders] Resolved remote title for ${targetId}: ${title}`);
          updateRemoteOrderTitle(targetId, title);
        }
      });
    }
  } catch (err) {
    console.warn('[Orders] Remote sync failed:', err.message || err);
  }
}

// Start Express server inside Electron
function startServer() {
  const expressApp = express();
  const PORT = 8888;

  // Middleware to parse JSON bodies
  expressApp.use(express.json());

  // Serve static files
  expressApp.use(express.static(path.join(__dirname, 'public')));
  expressApp.use('/people', express.static(path.join(__dirname, 'people')));

  // Stream API endpoint (inline to avoid require issues)
  expressApp.get('/api/stream', async (req, res) => {
    const { id } = req.query;

    if (!id || !isValidVideoId(id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const url = `https://www.youtube.com/watch?v=${id}`;
    const isWindows = os.platform() === 'win32';
    const ytdlpPath = path.join(__dirname, isWindows ? 'yt-dlp.exe' : 'yt-dlp');

    console.log(`[Stream] ${url}`);

    try {
      const args = [
        '-f', 'bestaudio/best',
        '--no-playlist',
        '--quiet',
        '--js-runtimes', 'node',
        '-o', '-',
        url
      ];

      const ytdlp = spawn(ytdlpPath, args);

      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');

      ytdlp.stdout.pipe(res);
      ytdlp.stderr.on('data', (data) => console.error(`[yt-dlp] ${data}`));
      ytdlp.on('error', (err) => console.error(`[yt-dlp error]`, err));

      req.on('close', () => ytdlp.kill());
    } catch (err) {
      console.error('[Stream error]', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // API to get/set order enabled state (admin only)
  expressApp.get('/api/order-status', async (req, res) => {
    try {
      await ensureOrderEnabledSynced();
      res.json({ enabled: orderEnabled, synced: true });
    } catch (err) {
      res.status(502).json({
        enabled: orderEnabled,
        synced: false,
        error: 'Khong lay duoc trang thai order tu web app',
      });
    }
  });
  expressApp.post('/api/order-toggle', async (req, res) => {
    const nextEnabled = req.body.enabled === true;
    try {
      const remote = await updateRemoteOrderEnabled(nextEnabled);
      orderEnabled = nextEnabled;
      orderEnabledSynced = true;
      console.log(`[Order] Order ${orderEnabled ? 'ENABLED' : 'DISABLED'} by admin`);
      res.json({ enabled: orderEnabled, remote });
    } catch (err) {
      console.warn('[Order] Failed to sync remote order state:', err.message || err);
      res.status(502).json({
        enabled: orderEnabled,
        error: 'Khong dong bo duoc trang thai order len web app',
      });
    }
  });

  // API to submit an order
  expressApp.post('/api/order', (req, res) => {
    const { name, url, adminBypass } = req.body;
    if (!orderEnabled && !adminBypass) {
      return res.status(403).json({ error: 'Order nhạc hiện đang tắt — chờ admin mở nhé! 🎵' });
    }
    if (!name || !url) {
      return res.status(400).json({ error: 'Vui lòng nhập tên và đường dẫn bài hát!' });
    }

    // Extract video ID
    let vid = null;
    try {
      const u = new URL(url);
      vid = u.searchParams.get('v') || u.pathname.split('/').pop();
    } catch {
      const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
      vid = m ? m[1] : null;
    }

    if (!vid || !isValidVideoId(vid)) {
      return res.status(400).json({ error: 'Đường dẫn YouTube không hợp lệ!' });
    }

    const cleanUrl = `https://www.youtube.com/watch?v=${vid}`;
    const orderId = '_' + Math.random().toString(36).substr(2, 9);

    const newOrder = {
      id: orderId,
      name: name.trim(),
      url: cleanUrl,
      vid: vid,
      title: 'Đang tải thông tin bài hát...',
      timestamp: Date.now(),
      timestampMs: Date.now(),
      source: 'local',
    };

    orderQueue.push(newOrder);

    // Fetch title in background using yt-dlp
    const isWindows = os.platform() === 'win32';
    const ytdlpPath = path.join(__dirname, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
    const { execFile } = require('child_process');
    
    // Use execFile to bypass cmd.exe shell encoding issues on Windows and read UTF-8 output directly
    execFile(ytdlpPath, ['--encoding', 'utf-8', '--js-runtimes', 'node', '--get-title', cleanUrl], { encoding: 'utf8' }, (err, stdout, stderr) => {
      let finalTitle = `Yêu cầu nhạc (${vid})`;
      if (!err && stdout) {
        finalTitle = stdout.trim();
      } else if (err) {
        console.error('[Queue] Get title error:', err.message || err);
      }
      
      const idx = orderQueue.findIndex(item => item.id === orderId);
      if (idx !== -1) {
        orderQueue[idx].title = finalTitle;
        console.log(`[Queue] Updated title for ${orderId}: ${finalTitle}`);
      }
    });

    res.json({ success: true, message: 'Đã thêm bài hát vào danh sách chờ!', order: newOrder });
  });

  // API to get all pending orders
  expressApp.get('/api/orders', (req, res) => {
    res.json({ orders: orderQueue });
  });

  // API to pop and get next order (Round Robin, max 2 consecutive per user)
  expressApp.post('/api/orders/next', async (req, res) => {
    await syncRemoteOrders();

    if (orderQueue.length === 0) {
      return res.json({ nextSong: null });
    }

    let selectedIndex = -1;

    if (currentPlayingUser && consecutiveCount >= 2) {
      // Find the first song by a different user
      selectedIndex = orderQueue.findIndex(item => item.name.toLowerCase() !== currentPlayingUser.toLowerCase());
    }

    // Fallback to the first song in queue if no other user is found
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }

    const nextSong = orderQueue[selectedIndex];
    if (nextSong && nextSong.source === 'webapp' && isFallbackOrderTitle(nextSong.title) && nextSong.url && nextSong.vid) {
      const resolvedTitle = await resolveTitleWithYtDlp(nextSong.url, nextSong.vid);
      nextSong.title = resolvedTitle;
      const idx = orderQueue.findIndex(item => item.id === nextSong.id);
      if (idx !== -1) {
        orderQueue[idx].title = resolvedTitle;
      }
      updateRemoteOrderTitle(nextSong.id, resolvedTitle);
    }
    orderQueue.splice(selectedIndex, 1);

    if (nextSong && nextSong.source === 'webapp') {
      completedRemoteOrderIds.add(nextSong.id);
      markRemoteOrderDone(nextSong.id).catch(err => {
        console.warn('[Orders] Failed to delete played remote order:', err.message || err);
      });
    }

    // Update scheduling tracker
    if (currentPlayingUser && currentPlayingUser.toLowerCase() === nextSong.name.toLowerCase()) {
      consecutiveCount++;
    } else {
      currentPlayingUser = nextSong.name;
      consecutiveCount = 1;
    }

    res.json({ nextSong });
  });

  // API to remove an order (for host admin management)
  expressApp.post('/api/orders/remove', async (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Thiếu ID bài hát cần xóa!' });
    }

    const originalLen = orderQueue.length;
    const removedRemote = orderQueue.find(item => item.id === id && item.source === 'webapp');

    if (removedRemote) {
      try {
        await markRemoteOrderDone(removedRemote.id);
        completedRemoteOrderIds.add(removedRemote.id);
      } catch (err) {
        console.warn('[Orders] Failed to delete remote order:', err.message || err);
        return res.status(502).json({ error: 'Khong xoa duoc hang cho tren web app' });
      }
    }

    orderQueue = orderQueue.filter(item => item.id !== id);

    if (orderQueue.length === originalLen) {
      return res.status(404).json({ error: 'Không tìm thấy bài hát trong danh sách chờ!' });
    }

    res.json({ success: true, message: 'Đã xóa bài hát khỏi hàng đợi!' });
  });

  server = expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server started on http://127.0.0.1:${PORT}`);
    syncRemoteOrders();
    ensureOrderEnabledSynced().catch(err => {
      console.warn('[Order] Initial order state sync failed:', err.message || err);
    });
    if (!remoteOrderSyncTimer) {
      remoteOrderSyncTimer = setInterval(syncRemoteOrders, 5000);
    }
  }).on('error', (err) => {
    console.error('❌ Server error:', err.message);
  });
}

// Create browser window
function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true, // Show immediately
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0f0f14'
  });

  // Load URL with retry
  let attempts = 0;
  const tryLoad = () => {
    attempts++;
    console.log(`Loading attempt ${attempts}...`);
    
    mainWindow.loadURL('http://127.0.0.1:8888').catch(err => {
      console.error(`Load failed (${attempts}):`, err.message);
      if (attempts < 5) {
        setTimeout(tryLoad, 1000);
      }
    });
  };

  setTimeout(tryLoad, 2000);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Window loaded!');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Load failed:', errorCode, errorDescription);
  });
}

// App lifecycle
app.on('ready', () => {
  console.log('App ready, starting server...');
  try {
    startServer();
    createWindow();
  } catch (err) {
    console.error('Fatal error:', err);
  }
});

app.on('window-all-closed', () => {
  if (remoteOrderSyncTimer) clearInterval(remoteOrderSyncTimer);
  if (server) server.close();
  app.quit();
});
