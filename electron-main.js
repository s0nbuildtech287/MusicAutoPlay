const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Start Express server
function startServer() {
  console.log('Starting server...');
  serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
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
    title: 'Lotusquant Music',
    backgroundColor: '#0f0f14'
  });

  // Show loading page from file
  mainWindow.loadFile(path.join(__dirname, 'public', 'loading.html'));

  // Wait for server to start, then load
  let retries = 0;
  const maxRetries = 10;
  
  const tryLoad = () => {
    console.log(`Attempting to load app... (attempt ${retries + 1}/${maxRetries})`);
    mainWindow.loadURL('http://localhost:7777').then(() => {
      console.log('App loaded successfully!');
    }).catch(err => {
      console.log(`Load attempt ${retries + 1} failed:`, err.message);
      retries++;
      if (retries < maxRetries) {
        setTimeout(tryLoad, 1500);
      } else {
        console.error('Failed to load after', maxRetries, 'attempts');
        mainWindow.loadFile(path.join(__dirname, 'public', 'loading.html'));
      }
    });
  };
  
  setTimeout(tryLoad, 3000);

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
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
