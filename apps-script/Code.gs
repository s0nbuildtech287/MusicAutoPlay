/** MyMusic temporary Google Sheets database. */
const SHEETS = {
  users: ["Users", ["userId", "displayName", "password", "createdAt", "lastSeenAt"]],
  playlists: ["Playlists", ["id", "userId", "name", "topic", "createdAt"]],
  songs: ["Songs", ["id", "userId", "playlistId", "title", "artist", "url", "vid", "createdAt"]],
  libraryHidden: ["LibraryHidden", ["userId", "vid", "hiddenAt"]],
  favorites: ["Favorites", ["userId", "vid", "songJson", "createdAt"]],
  history: ["History", ["userId", "vid", "title", "artist", "playlistId", "isOrder", "playedAt"]]
};

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function response_(value, e) {
  const callback = String(e && e.parameter && e.parameter.callback || '').trim();
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(value)})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(value);
}

function sheet_(key) {
  const [name, headers] = SHEETS[key];
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(name);
  if (!sheet) sheet = book.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
  headers.forEach((header) => {
    if (!currentHeaders.includes(header)) sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
  });
  return sheet;
}

function rows_(key) {
  const sheet = sheet_(key);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || SHEETS[key][1];
  return values.filter((row) => row.some(Boolean)).map((row) => headers.reduce((item, header, i) => {
    item[header] = row[i] ?? "";
    return item;
  }, {}));
}

function append_(key, item) {
  const sheet = sheet_(key);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  sheet.appendRow(headers.map((header) => item[header] ?? ""));
}

function ensureUser_(userId, displayName) {
  const id = String(userId || "guest");
  const exists = rows_("users").some((row) => String(row.userId) === id);
  const now = new Date().toISOString();
  if (!exists) append_("users", { userId: id, displayName: displayName || id, createdAt: now, lastSeenAt: now });
  return id;
}

function youtubeTitle_(url, fallback) {
  try {
    const endpoint = "https://www.youtube.com/oembed?url=" + encodeURIComponent(String(url || "")) + "&format=json";
    const response = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true, followRedirects: true });
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const data = JSON.parse(response.getContentText());
      if (data.title) return String(data.title).trim();
    }
  } catch (error) {
    console.warn("Could not resolve YouTube title: " + error.message);
  }
  return String(fallback || "YouTube").trim();
}

// Run once manually in Apps Script before deploying.
function initSetupSheet() {
  Object.keys(SHEETS).forEach((key) => sheet_(key));
  Logger.log("MyMusic database initialized");
}

function repairSongTitles_() {
  const sheet = sheet_("songs");
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || SHEETS.songs[1];
  const titleCol = headers.indexOf("title");
  const urlCol = headers.indexOf("url");
  const vidCol = headers.indexOf("vid");
  let repaired = 0;
  values.forEach((row, index) => {
    const currentTitle = String(row[titleCol] || "").trim();
    const videoId = String(row[vidCol] || "").trim();
    if (!videoId || (currentTitle && currentTitle !== videoId)) return;
    const title = youtubeTitle_(row[urlCol], videoId);
    if (title && title !== currentTitle) {
      sheet.getRange(index + 2, titleCol + 1).setValue(title);
      repaired += 1;
    }
  });
  return repaired;
}

function repairUserColumns_() {
  const sheet = sheet_("users");
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];
  const userCol = headers.indexOf("userId");
  const createdCol = headers.indexOf("createdAt");
  const lastSeenCol = headers.indexOf("lastSeenAt");
  const passwordCol = headers.indexOf("password");
  const isIsoDate = value => /^\d{4}-\d{2}-\d{2}T/.test(String(value || ""));
  let repaired = 0;
  values.forEach((row, index) => {
    const created = row[createdCol];
    const lastSeen = row[lastSeenCol];
    const password = row[passwordCol];
    if (!String(row[userCol] || "") || isIsoDate(created) || !isIsoDate(lastSeen) || !isIsoDate(password)) return;
    sheet.getRange(index + 2, createdCol + 1).setValue(lastSeen);
    sheet.getRange(index + 2, lastSeenCol + 1).setValue(password);
    sheet.getRange(index + 2, passwordCol + 1).setValue(created);
    repaired += 1;
  });
  return repaired;
}

function doGet(e) {
  const p = e.parameter || {};
  if (p.action === "repairUsers") {
    return response_({ ok: true, repaired: repairUserColumns_() }, e);
  }
  if (p.action === "repairTitles") {
    return response_({ ok: true, repaired: repairSongTitles_() }, e);
  }
  if ((p.action || "bootstrap") !== "bootstrap") return json_({ ok: false, error: "Unknown action" });
  const userId = ensureUser_(p.userId || "guest", p.displayName || "");
  let playlists = rows_("playlists").filter((row) => String(row.userId) === userId);
  if (playlists.length === 0) {
    const playlist = { id: Utilities.getUuid(), userId, name: "Playlist mặc định", topic: "Chung", createdAt: new Date().toISOString() };
    append_("playlists", playlist);
    playlists = [playlist];
  }
  const playlistIds = new Set(playlists.map((row) => String(row.id)));
  const libraryHidden = rows_("libraryHidden").filter((row) => String(row.userId) === userId).map((row) => String(row.vid));
  return response_({
    ok: true,
    users: rows_("users").filter((row) => String(row.userId) === userId),
    playlists,
    songs: rows_("songs").filter((row) => !libraryHidden.includes(String(row.vid)) && (String(row.userId) === userId || playlistIds.has(String(row.playlistId)))),
    libraryHidden,
    favorites: rows_("favorites").filter((row) => String(row.userId) === userId),
    history: rows_("history").filter((row) => String(row.userId) === userId).slice(-500)
  }, e);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.action === "register") {
      const username = String(body.userId || body.username || "").trim();
      const password = String(body.password || "");
      if (username.length < 3 || password.length < 4) return json_({ ok: false, error: "Invalid registration data" });
      const exists = rows_("users").some((row) => String(row.userId) === username);
      if (exists) return json_({ ok: false, error: "Username already exists" });
      const now = new Date().toISOString();
      append_("users", { userId: username, displayName: body.displayName || username, password, createdAt: now, lastSeenAt: now });
      return json_({ ok: true, user: { userId: username, displayName: body.displayName || username } });
    }
    const userId = ensureUser_(body.userId || "guest", body.displayName || "");
    const now = new Date().toISOString();
    if (body.action === "createPlaylist") {
      const playlist = { id: Utilities.getUuid(), userId, name: String(body.name || "Playlist mới").trim(), topic: String(body.topic || "Chung").trim(), createdAt: now };
      append_("playlists", playlist);
      return json_({ ok: true, playlist });
    }
    if (body.action === "addSong") {
      const title = String(body.title || "").trim() || youtubeTitle_(body.url, body.vid);
      const song = { id: Utilities.getUuid(), userId, playlistId: body.playlistId || "", title, artist: body.artist || "YouTube", url: body.url, vid: body.vid, createdAt: now };
      append_("songs", song);
      return json_({ ok: true, song });
    }
    if (body.action === "removeFromLibrary") {
      const vid = String(body.vid || body.song?.vid || "").trim();
      if (!vid) return json_({ ok: false, error: "Missing video id" });
      const exists = rows_("libraryHidden").some((row) => String(row.userId) === userId && String(row.vid) === vid);
      if (!exists) append_("libraryHidden", { userId, vid, hiddenAt: now });
      return json_({ ok: true, vid });
    }
    if (body.action === "toggleFavorite") {
      const sheet = sheet_("favorites");
      const values = sheet.getDataRange().getValues();
      const index = values.findIndex((row, i) => i > 0 && String(row[0]) === userId && String(row[1]) === String(body.song.vid));
      if (index > 0) sheet.deleteRow(index + 1);
      else append_("favorites", { userId, vid: body.song.vid, songJson: JSON.stringify(body.song), createdAt: now });
      return json_({ ok: true, favorite: index <= 0 });
    }
    if (body.action === "recordHistory") {
      append_("history", { userId, vid: body.song.vid, title: body.song.title, artist: body.song.artist, playlistId: body.song.playlistId || "", isOrder: !!body.isOrder, playedAt: now });
      return json_({ ok: true });
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}
