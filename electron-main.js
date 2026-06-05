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
    title: 'Lotusquant Music — Đang khởi động...',
    backgroundColor: '#0f0f14' // Show dark background while loading
  });

  // Show loading message
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          background: #0f0f14;
          color: #e8e8f0;
          font-family: 'Segoe UI', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(124, 106, 247, 0.2);
          border-top-color: #7c6af7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h2 { margin-top: 20px; font-size: 1.2rem; }
        p { color: #8888aa; font-size: 0.9rem; }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <h2>🎵 Lotusquant Music</h2>
      <p>Đang khởi động server...</p>
    </body>
    </html>
  `));

  // Wait for server to start, then load
  let retries = 0;
  const maxRetries = 10;
  
  const tryLoad = () => {
    console.log(`Attempting to load app... (attempt ${retries + 1}/${maxRetries})`);
    mainWindow.loadURL('http://localhost:7777').then(() => {
      console.log('App loaded successfully!');
      mainWindow.setTitle('Lotusquant Music');
    }).catch(err => {
      console.log(`Load attempt ${retries + 1} failed:`, err.message);
      retries++;
      if (retries < maxRetries) {
        setTimeout(tryLoad, 1500);
      } else {
        console.error('Failed to load after', maxRetries, 'attempts');
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                background: #0f0f14;
                color: #e8e8f0;
                font-family: 'Segoe UI', system-ui, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
                padding: 20px;
              }
              h2 { color: #ff6b6b; }
              button {
                margin-top: 20px;
                padding: 10px 20px;
                background: #7c6af7;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
              }
            </style>
          </head>
          <body>
            <h2>❌ Không thể khởi động server</h2>
            <p>Port 7777 có thể đang bị chiếm bởi ứng dụng khác.</p>
            <button onclick="location.reload()">🔄 Thử lại</button>
          </body>
          </html>
        `));
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
