/** MyMusic temporary Google Sheets database. */
const SHEETS = {
  users: ["Users", ["userId", "displayName", "createdAt", "lastSeenAt"]],
  playlists: ["Playlists", ["id", "userId", "name", "topic", "createdAt"]],
  songs: ["Songs", ["id", "userId", "playlistId", "title", "artist", "url", "vid", "createdAt"]],
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
  const headers = SHEETS[key][1];
  sheet_(key).appendRow(headers.map((header) => item[header] ?? ""));
}

function ensureUser_(userId, displayName) {
  const id = String(userId || "guest");
  const exists = rows_("users").some((row) => String(row.userId) === id);
  const now = new Date().toISOString();
  if (!exists) append_("users", { userId: id, displayName: displayName || id, createdAt: now, lastSeenAt: now });
  return id;
}

// Run once manually in Apps Script before deploying.
function initSetupSheet() {
  Object.keys(SHEETS).forEach((key) => sheet_(key));
  Logger.log("MyMusic database initialized");
}

function doGet(e) {
  const p = e.parameter || {};
  if ((p.action || "bootstrap") !== "bootstrap") return json_({ ok: false, error: "Unknown action" });
  const userId = ensureUser_(p.userId || "guest", p.displayName || "");
  let playlists = rows_("playlists").filter((row) => !row.userId || String(row.userId) === userId);
  if (playlists.length === 0) {
    const playlist = { id: Utilities.getUuid(), userId, name: "Playlist mặc định", topic: "Chung", createdAt: new Date().toISOString() };
    append_("playlists", playlist);
    playlists = [playlist];
  }
  const playlistIds = new Set(playlists.map((row) => String(row.id)));
  return response_({
    ok: true,
    users: rows_("users").filter((row) => String(row.userId) === userId),
    playlists,
    songs: rows_("songs").filter((row) => !row.userId || String(row.userId) === userId || playlistIds.has(String(row.playlistId))),
    favorites: rows_("favorites").filter((row) => String(row.userId) === userId),
    history: rows_("history").filter((row) => String(row.userId) === userId).slice(-500)
  }, e);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const userId = ensureUser_(body.userId || "guest", body.displayName || "");
    const now = new Date().toISOString();
    if (body.action === "createPlaylist") {
      const playlist = { id: Utilities.getUuid(), userId, name: String(body.name || "Playlist mới").trim(), topic: String(body.topic || "Chung").trim(), createdAt: now };
      append_("playlists", playlist);
      return json_({ ok: true, playlist });
    }
    if (body.action === "addSong") {
      const song = { id: Utilities.getUuid(), userId, playlistId: body.playlistId || "", title: body.title || body.vid, artist: body.artist || "YouTube", url: body.url, vid: body.vid, createdAt: now };
      append_("songs", song);
      return json_({ ok: true, song });
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
