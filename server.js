const express = require('express');
const path = require('path');
const streamHandler = require('./api/stream');

const app = express();
const PORT = 8888;

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve people photos
app.use('/people', express.static(path.join(__dirname, 'people')));

// Route /api/stream → our handler
app.get('/api/stream', streamHandler);

// All other routes → index.html
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎵 Company Music Player running at http://localhost:${PORT}\n`);
});
