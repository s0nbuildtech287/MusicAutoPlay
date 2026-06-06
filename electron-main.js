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

// Start Express server inside Electron
function startServer() {
  const expressApp = express();
  const PORT = 7777;

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

  server = expressApp.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Server started on http://127.0.0.1:${PORT}`);
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
