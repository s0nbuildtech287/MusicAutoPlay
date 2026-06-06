const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let server;

// Validate YouTube video ID
function isValidVideoId(id) {
  return /^[\w-]{11}$/.test(id);
}

// Get local IPv4 address (prioritizing physical Wi-Fi/Ethernet adapters and filtering out virtual/VPN cards)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    const nameLower = name.toLowerCase();
    
    // Check if the interface is virtual, VPN, Docker, WSL, etc.
    const isVirtualOrVpn = /virtual|vbox|vmware|vpn|wsl|hyper-v|docker|npcap|taptun|zerotier|tailscale|forti|cisco|anyconnect|globalprotect|openvpn|loopback|teredo/i.test(nameLower);

    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        let score = 0;
        
        // Prefer Wi-Fi or Ethernet interfaces
        if (/wi-fi|wifi|wlan|ethernet|eth|en\d+|lan|wireless/i.test(nameLower)) {
          score += 50;
        }
        
        // De-prioritize virtual interfaces
        if (isVirtualOrVpn) {
          score -= 100;
        }

        // Prefer typical LAN subnets (192.168.x.x, 10.x.x.x)
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          score += 10;
        } else if (iface.address.startsWith('172.')) {
          const parts = iface.address.split('.');
          const secondOctet = parseInt(parts[1], 10);
          if (secondOctet >= 16 && secondOctet <= 31) {
            score += 5;
          }
        }

        candidates.push({ address: iface.address, score, name });
      }
    }
  }

  if (candidates.length > 0) {
    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    console.log('[Network] Detected IPs:', candidates.map(c => `${c.name}: ${c.address} (score: ${c.score})`).join(', '));
    return candidates[0].address;
  }

  return '127.0.0.1';
}

// Order state
let orderQueue = [];
let currentPlayingUser = null;
let consecutiveCount = 0;
let membersList = [];

// Start Express server inside Electron
function startServer() {
  const expressApp = express();
  const PORT = 7777;

  // Middleware to parse JSON bodies
  expressApp.use(express.json());

  // Serve static files
  expressApp.use(express.static(path.join(__dirname, 'public')));
  expressApp.use('/people', express.static(path.join(__dirname, 'people')));

  // Order page route
  expressApp.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'order.html'));
  });

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

  // API to sync members list (from Google Sheet loaded in host player)
  expressApp.post('/api/members', (req, res) => {
    const { members } = req.body;
    if (Array.isArray(members)) {
      membersList = members.map(m => m.trim()).filter(Boolean);
      console.log(`[Queue] Updated members list from host: ${membersList.length} members`);
    }
    res.json({ success: true });
  });

  // API to get members list (for order page dropdown)
  expressApp.get('/api/members', (req, res) => {
    res.json({ members: membersList });
  });

  // API to get local IP
  expressApp.get('/api/ip', (req, res) => {
    res.json({ ip: getLocalIp(), port: PORT });
  });

  // API to submit an order
  expressApp.post('/api/order', (req, res) => {
    const { name, url } = req.body;
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
      timestamp: Date.now()
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
  expressApp.post('/api/orders/next', (req, res) => {
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
    orderQueue.splice(selectedIndex, 1);

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
  expressApp.post('/api/orders/remove', (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Thiếu ID bài hát cần xóa!' });
    }

    const originalLen = orderQueue.length;
    orderQueue = orderQueue.filter(item => item.id !== id);

    if (orderQueue.length === originalLen) {
      return res.status(404).json({ error: 'Không tìm thấy bài hát trong danh sách chờ!' });
    }

    res.json({ success: true, message: 'Đã xóa bài hát khỏi hàng đợi!' });
  });

  server = expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server started on http://0.0.0.0:${PORT} (LAN: http://${getLocalIp()}:${PORT})`);
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
    
    mainWindow.loadURL('http://127.0.0.1:7777').catch(err => {
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
  if (server) server.close();
  app.quit();
});
