const CONFIG = {
  SPREADSHEET_ID: '1P_LMInRLMTjycdazok0fvRGNAsgRzMHNfK3svktA7SM',
  ORDERS_SHEET_NAME: 'Orders',
  LIST_SHEET_NAME: 'List',
};

function doGet(e) {
  const action = e && e.parameter && e.parameter.action ? String(e.parameter.action).toLowerCase() : '';

  if (action === 'health') {
    return jsonOutput_({
      ok: true,
      app: 'lotusquant-order-webapp',
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      ordersSheet: CONFIG.ORDERS_SHEET_NAME,
      listSheet: CONFIG.LIST_SHEET_NAME,
    });
  }

  if (action === 'list') {
    return jsonOutput_({ ok: true, orders: listOrders_() });
  }

  return renderOrderPage_();
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const result = appendOrder_(payload);
    return jsonOutput_({ ok: true, order: result });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function submitOrderFromPage(name, url) {
  return appendOrder_({
    name: String(name || '').trim(),
    url: String(url || '').trim(),
  });
}

function getPageOrders() {
  return listOrders_();
}

function renderOrderPage_() {
  return HtmlService.createHtmlOutput(getOrderPageHtml_())
    .setTitle('Lotusquant Order')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function parsePayload_(e) {
  const params = e && e.parameter ? e.parameter : {};
  let body = {};

  if (e && e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      body = {};
    }
  }

  return {
    name: String(body.name || params.name || '').trim(),
    url: String(body.url || params.url || '').trim(),
  };
}

function appendOrder_(payload) {
  const name = String(payload.name || '').trim();
  const url = String(payload.url || '').trim();

  if (!name) throw new Error('Missing name');
  if (!url) throw new Error('Missing url');

  const vid = extractVideoId_(url);
  if (!vid) throw new Error('Invalid YouTube URL');

  const title = fetchYouTubeTitle_(vid);
  const sheet = getOrdersSheet_();
  const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date();
  const canonicalUrl = `https://www.youtube.com/watch?v=${vid}`;

  sheet.appendRow([id, timestamp, 'pending', name, canonicalUrl, vid, title, '']);

  return {
    id,
    timestamp: timestamp.toISOString(),
    status: 'pending',
    name,
    url: canonicalUrl,
    vid,
    title,
  };
}

function listOrders_() {
  const sheet = getOrdersSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values
    .slice(1)
    .filter(row => row[0] || row[3] || row[4])
    .map(row => ({
      id: String(row[0] || '').trim(),
      timestamp: row[1] ? new Date(row[1]).toISOString() : '',
      status: String(row[2] || 'pending').trim().toLowerCase(),
      name: String(row[3] || '').trim(),
      url: String(row[4] || '').trim(),
      vid: String(row[5] || '').trim(),
      title: String(row[6] || '').trim(),
      note: String(row[7] || '').trim(),
    }));
}

function listMemberNames_() {
  const sheet = getListSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headerRow = values[0].map(cell => normalizeText_(cell));
  const nameCol = headerRow.findIndex(cell => cell === 'ten');
  if (nameCol === -1) return [];

  const seen = new Set();
  const names = [];
  for (let i = 1; i < values.length; i++) {
    const name = String(values[i][nameCol] || '').trim();
    if (!name) continue;
    const key = normalizeText_(name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

function getOrdersSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.ORDERS_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.ORDERS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'timestamp', 'status', 'name', 'url', 'vid', 'title', 'note']);
  }

  return sheet;
}

function getListSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.LIST_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.LIST_SHEET_NAME);
  return sheet;
}

function normalizeText_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function extractVideoId_(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const direct = raw.match(/^[\w-]{11}$/);
  if (direct) return direct[0];

  try {
    const u = new URL(raw);
    const v = u.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;

    const short = u.hostname.includes('youtu.be') ? u.pathname.split('/').filter(Boolean)[0] : '';
    if (short && /^[\w-]{11}$/.test(short)) return short;

    const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
    if (embed) return embed[1];
  } catch (err) {}

  const fallback = raw.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return fallback ? fallback[1] : null;
}

function fetchYouTubeTitle_(vid) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(vid)}&format=json`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
      const data = JSON.parse(res.getContentText());
      if (data && data.title) return String(data.title).trim();
    }
  } catch (err) {
    console.warn('Failed to fetch title:', err);
  }
  return `Yeu cau nhac (${vid})`;
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function buildNameOptionsHtml_() {
  return listMemberNames_()
    .map(name => `<option value="${escapeHtml_(name)}"></option>`)
    .join('');
}

function getOrderPageHtml_() {
  return [
    "<!doctype html>",
    "<html lang=\"vi\">",
    "<head>",
    "  <meta charset=\"utf-8\" />",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
    "  <title>Lotusquant Order</title>",
    "  <style>",
    "    :root { color-scheme: dark; }",
    "    * { box-sizing: border-box; }",
    "    body {",
    "      margin: 0;",
    "      font-family: system-ui, -apple-system, Segoe UI, sans-serif;",
    "      background:",
    "        radial-gradient(circle at top, rgba(251, 146, 60, 0.18), transparent 35%),",
    "        linear-gradient(180deg, #0b0b11, #11111a);",
    "      color: #f3f4f6;",
    "      min-height: 100vh;",
    "      padding: 24px 16px 40px;",
    "    }",
    "    .wrap { max-width: 560px; margin: 0 auto; }",
    "    .card {",
    "      background: rgba(17, 17, 26, 0.86);",
    "      border: 1px solid rgba(255, 255, 255, 0.08);",
    "      border-radius: 18px;",
    "      padding: 20px;",
    "      box-shadow: 0 16px 50px rgba(0, 0, 0, 0.35);",
    "      backdrop-filter: blur(16px);",
    "    }",
    "    h1 { margin: 0 0 6px; font-size: 1.4rem; }",
    "    p { margin: 0 0 14px; color: #cbd5e1; line-height: 1.45; }",
    "    label {",
    "      display: block;",
    "      margin: 14px 0 8px;",
    "      font-size: 0.78rem;",
    "      text-transform: uppercase;",
    "      letter-spacing: 0.06em;",
    "      color: #fca36b;",
    "      font-weight: 700;",
    "    }",
    "    input, button {",
    "      width: 100%;",
    "      border-radius: 12px;",
    "      border: 1px solid rgba(255, 255, 255, 0.10);",
    "      background: rgba(255, 255, 255, 0.05);",
    "      color: #fff;",
    "      padding: 12px 14px;",
    "      font: inherit;",
    "      outline: none;",
    "    }",
    "    button {",
    "      margin-top: 16px;",
    "      cursor: pointer;",
    "      border: none;",
    "      background: linear-gradient(135deg, #fb923c, #ec4899, #8b5cf6);",
    "      font-weight: 700;",
    "    }",
    "    button:disabled { opacity: 0.65; cursor: not-allowed; }",
    "    .grid { display: grid; gap: 12px; margin-top: 18px; }",
    "    .item {",
    "      border: 1px solid rgba(255, 255, 255, 0.08);",
    "      border-radius: 14px;",
    "      padding: 12px 14px;",
    "      background: rgba(255, 255, 255, 0.03);",
    "    }",
    "    .item .top { display: flex; justify-content: space-between; gap: 10px; align-items: start; }",
    "    .name { font-weight: 700; }",
    "    .meta { color: #fca36b; font-size: 0.82rem; margin-top: 4px; word-break: break-word; }",
    "    .title { margin-top: 8px; font-size: 0.92rem; color: #f8fafc; }",
    "    .small { color: #94a3b8; font-size: 0.78rem; margin-top: 8px; }",
    "    .toast {",
    "      position: fixed;",
    "      left: 50%;",
    "      bottom: 18px;",
    "      transform: translateX(-50%);",
    "      background: rgba(15, 23, 42, 0.96);",
    "      color: #fff;",
    "      border: 1px solid rgba(255, 255, 255, 0.1);",
    "      border-radius: 999px;",
    "      padding: 10px 14px;",
    "      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);",
    "      opacity: 0;",
    "      pointer-events: none;",
    "      transition: opacity 0.2s, transform 0.2s;",
    "    }",
    "    .toast.show { opacity: 1; transform: translateX(-50%) translateY(-2px); }",
    "  </style>",
    "</head>",
    "<body>",
    "  <div class=\"wrap\">",
    "    <div class=\"card\">",
    "      <h1>Lotusquant Order</h1>",
    "      <p>Gửi link YouTube để thêm bài vào hàng đợi. Link này hoạt động qua Internet, không phụ thuộc IP LAN của máy phát.</p>",
    "      <form id=\"orderForm\">",
    "        <label for=\"name\">Tên</label>",
    "        <input id=\"name\" name=\"name\" list=\"memberNames\" maxlength=\"30\" autocomplete=\"name\" placeholder=\"Tên của bạn\" required />",
    "        <datalist id=\"memberNames\">__NAME_OPTIONS__</datalist>",
    "",
    "        <label for=\"url\">Link YouTube</label>",
    "        <input id=\"url\" name=\"url\" type=\"url\" placeholder=\"https://www.youtube.com/watch?v=...\" required />",
    "",
    "        <button id=\"submitBtn\" type=\"submit\">Gửi order</button>",
    "      </form>",
    "    </div>",
    "",
    "    <div class=\"card\" style=\"margin-top:16px;\">",
    "      <h1 style=\"font-size:1.15rem;\">Hàng đợi gần đây</h1>",
    "      <div id=\"queue\" class=\"grid\"></div>",
    "      <div class=\"small\" style=\"margin-top:12px;\">",
    "        Dữ liệu được ghi vào sheet <strong>Orders</strong>.",
    "        Sheet nhạc mặc định nằm ở tab <strong>List</strong> trong cùng spreadsheet.",
    "      </div>",
    "    </div>",
    "  </div>",
    "",
    "  <div id=\"toast\" class=\"toast\"></div>",
    "",
    "  <script>",
    "    const form = document.getElementById('orderForm');",
    "    const btn = document.getElementById('submitBtn');",
    "    const queue = document.getElementById('queue');",
    "    const toastEl = document.getElementById('toast');",
    "",
    "    function showToast(msg) {",
    "      toastEl.textContent = msg;",
    "      toastEl.classList.add('show');",
    "      clearTimeout(window.__t);",
    "      window.__t = setTimeout(() => toastEl.classList.remove('show'), 2400);",
    "    }",
    "",
    "    function escapeHtml(str) {",
    "      return String(str).replace(/[&<>\"']/g, m => ({",
    "        '&': '&amp;',",
    "        '<': '&lt;',",
    "        '>': '&gt;',",
    "        '\"': '&quot;',",
    "        \"'\": '&#39;'",
    "      }[m]));",
    "    }",
    "",
    "    function renderQueue(orders) {",
    "      const latest = (orders || []).slice(-8).reverse();",
    "      queue.innerHTML = latest.length ? latest.map(o => `",
    "        <div class=\"item\">",
    "          <div class=\"top\">",
    "            <div>",
    "              <div class=\"name\">${escapeHtml(o.name || '')}</div>",
    "              <div class=\"meta\">${escapeHtml(o.timestamp || '')}</div>",
    "            </div>",
    "            <div class=\"meta\">${escapeHtml(o.status || 'pending')}</div>",
    "          </div>",
    "          <div class=\"title\">${escapeHtml(o.title || 'Đang chờ xử lý')}</div>",
    "        </div>",
    "      `).join('') : '<div class=\"small\">Chưa có order nào.</div>';",
    "    }",
    "",
    "    function loadQueue() {",
    "      if (typeof google === 'undefined' || !google.script || !google.script.run) {",
    "        queue.innerHTML = '<div class=\"small\">Không tải được queue.</div>';",
    "        return;",
    "      }",
    "      google.script.run",
    "        .withSuccessHandler((orders) => renderQueue(orders))",
    "        .withFailureHandler((err) => {",
    "          queue.innerHTML = '<div class=\"small\">Không tải được queue.</div>';",
    "        })",
    "        .getPageOrders();",
    "    }",
    "",
    "    form.addEventListener('submit', async (e) => {",
    "      e.preventDefault();",
    "      btn.disabled = true;",
    "      btn.textContent = 'Đang gửi...';",
    "      try {",
    "        const name = document.getElementById('name').value.trim();",
    "        const url = document.getElementById('url').value.trim();",
    "        google.script.run",
    "          .withSuccessHandler(() => {",
    "            showToast('Đã gửi order');",
    "            document.getElementById('url').value = '';",
    "            loadQueue();",
    "          })",
    "          .withFailureHandler((err) => {",
    "            showToast((err && err.message) ? err.message : 'Không gửi được order');",
    "          })",
    "          .submitOrderFromPage(name, url);",
    "      } catch (err) {",
    "        showToast(err.message || 'Không gửi được order');",
    "      } finally {",
    "        btn.disabled = false;",
    "        btn.textContent = 'Gửi order';",
    "      }",
    "    });",
    "",
    "    loadQueue();",
    "    setInterval(loadQueue, 5000);",
    "  </script>",
    "</body>",
    "</html>",
    "",
  ].join('\n').replace('__NAME_OPTIONS__', buildNameOptionsHtml_());
}
