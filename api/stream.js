const https = require('https');
const http = require('http');

// Validate YouTube video ID (11 alphanumeric chars + - _)
function isValidVideoId(id) {
  return /^[\w-]{11}$/.test(id);
}

// Fetch from Invidious instance
function fetchInvidiousStream(id) {
  return new Promise((resolve, reject) => {
    // Try multiple Invidious instances
    const instances = [
      'invidious.snopyta.org',
      'yewtu.be',
      'inv.riverside.rocks'
    ];
    
    const instance = instances[Math.floor(Math.random() * instances.length)];
    const url = `https://${instance}/api/v1/videos/${id}`;
    
    console.log(`[Stream] Trying Invidious: ${instance}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error));
            return;
          }
          
          // Find best audio format
          const audioFormats = json.adaptiveFormats.filter(f => f.type?.includes('audio'));
          if (audioFormats.length === 0) {
            reject(new Error('No audio format found'));
            return;
          }
          
          // Sort by bitrate, get highest
          audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
          resolve(audioFormats[0].url);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Stream from URL
function streamFromUrl(url, res) {
  const client = url.startsWith('https') ? https : http;
  
  client.get(url, (audioRes) => {
    if (audioRes.statusCode !== 200) {
      throw new Error(`Failed to fetch audio: ${audioRes.statusCode}`);
    }
    
    res.setHeader('Content-Type', audioRes.headers['content-type'] || 'audio/webm');
    res.setHeader('Content-Length', audioRes.headers['content-length']);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    audioRes.pipe(res);
    
    audioRes.on('error', (err) => {
      console.error('[Stream] Audio stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' });
      }
    });
  }).on('error', (err) => {
    console.error('[Stream] Request error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || !isValidVideoId(id)) {
    return res.status(400).json({ error: 'Invalid or missing video ID' });
  }

  console.log(`[Stream] Fetching: ${id}`);

  try {
    const streamUrl = await fetchInvidiousStream(id);
    console.log(`[Stream] Got stream URL, proxying...`);
    streamFromUrl(streamUrl, res);
  } catch (err) {
    console.error('[Stream] Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
  
  req.on('close', () => {
    console.log(`[Stream] Client disconnected: ${id}`);
  });
};
