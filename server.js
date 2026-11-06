const express = require('express');
const path = require('path');
const streamHandler = require('./api/stream');

const app = express();
const PORT = 8888;
const ORDER_PUBLIC_URL = process.env.ORDER_PUBLIC_URL || 'https://script.google.com/macros/s/AKfycbwW1hNIHd5ck7xf_EQ407AWgikYELJqdqgOf0rQsIRUDPWTm51N2eevMLMPcCAkPO0Z0g/exec';

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve people photos
app.use('/people', express.static(path.join(__dirname, 'people')));

// Route /api/stream → our handler
app.get('/api/stream', streamHandler);

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
