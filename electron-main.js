const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const streamHandler = require('./api/stream');

let mainWindow;
let server;

// Start Express server inside Electron
function startServer() {
  const expressApp = express();
  const PORT = 7777;

  // Serve static files from /public
  expressApp.use(express.static(path.join(__dirname, 'public')));

  // Serve people photos
  expressApp.use('/people', express.static(path.join(__dirname, 'people')));

  // Route /api/stream → our handler
  expressApp.get('/api/stream', streamHandler);

  // All other routes → index.html
  expressApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  server = expressApp.listen(PORT, () => {
    console.log(`🎵 Server running at http://localhost:${PORT}`);
  });
}

// Create browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public', 'favicon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    title: 'Lotusquant Music'
  });

  // Wait for server to start, then load
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:7777');
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  app.quit();
});

app.on('will-quit', () => {
  if (server) {
    server.close();
  }
});
