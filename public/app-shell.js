/* MyMusic Player - Phase 1 shell controller.
 * This file intentionally talks to the legacy player through DOM events so
 * the existing audio, Sheet, Electron and LocalStorage logic stays intact.
 */
(function initAppShell() {
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const audio = $('audioEl');
  const legacyPlay = $('playPauseBtn');
  const legacyPrev = $('prevBtn');
  const legacyNext = $('nextBtn');
  const legacyVolume = $('volSlider');
  const npContent = $('npContent');
  const npAvatar = $('npAvatar');
  const colRight = document.querySelector('.col-right');
  const routeWorkspace = $('routeWorkspace');

  function renderRouteWorkspace(route) {
    if (!routeWorkspace) return;
    const count = $('playlistCount')?.textContent?.trim() || '0 bài';
    const views = {
      library: { eyebrow: 'YOUR LIBRARY', title: 'Thư viện nhạc', badge: 'LIBRARY', description: 'Tập trung toàn bộ bài hát đang có trong Sheet và trạng thái phát hiện tại.', tiles: [['🎵', 'Toàn bộ bài hát', count], ['🔎', 'Tìm kiếm nhanh', 'Tìm theo tên bài hoặc ca sĩ ở khung Queue'], ['▶️', 'Phát ngay', 'Chọn một bài trong danh sách để bắt đầu nghe']] },
      playlists: { eyebrow: 'YOUR PLAYLISTS', title: 'Playlist & chủ đề', badge: 'PLAYLISTS', description: 'Khu vực dành cho các danh sách nhạc riêng theo chủ đề của bạn.', tiles: [['📁', 'Playlist hiện tại', count], ['🗂️', 'Theo chủ đề', 'Các bài hát được nhóm theo playlist trong dữ liệu'], ['➕', 'Thêm playlist', 'Tạo playlist mới sẽ được kết nối với dữ liệu tài khoản']] },
      favorites: { eyebrow: 'YOUR FAVORITES', title: 'Bài hát yêu thích', badge: 'FAVORITES', description: 'Những bài bạn đánh dấu yêu thích sẽ được gom riêng tại đây.', tiles: [['💜', 'Đã yêu thích', 'Đồng bộ theo tài khoản hiện tại'], ['📌', 'Lưu để nghe lại', 'Bấm biểu tượng yêu thích trên bài hát để lưu'], ['🔁', 'Nghe lại', 'Các bài đã lưu luôn sẵn sàng trong playlist']] }
    };
    const view = views[route];
    if (!view) { routeWorkspace.hidden = true; routeWorkspace.innerHTML = ''; return; }
    routeWorkspace.hidden = false;
    routeWorkspace.innerHTML = `<div class="route-workspace-head"><div><span class="eyebrow">${view.eyebrow}</span><h2>${view.title}</h2><p>${view.description}</p></div><span class="route-workspace-badge">${view.badge}</span></div><div class="route-workspace-grid">${view.tiles.map(([icon, title, text]) => `<article class="route-tile"><div class="route-tile-icon">${icon}</div><strong>${title}</strong><small>${text}</small></article>`).join('')}</div>`;
  }

  const notify = (message) => {
    const container = $('toast-container');
    if (!container) return;
    const item = document.createElement('div');
    item.className = 'toast shell-toast';
    item.textContent = message;
    container.appendChild(item);
    setTimeout(() => item.remove(), 2200);
  };

  function setRoute(route) {
    const cleanRoute = route || 'home';
    body.dataset.route = cleanRoute;
    renderRouteWorkspace(cleanRoute);
    document.querySelectorAll('[data-route]').forEach((link) => {
      link.classList.toggle('active', link.dataset.route === cleanRoute);
    });

    body.classList.toggle('settings-open', cleanRoute === 'settings');
    body.classList.toggle('history-view', cleanRoute === 'history');
    body.classList.toggle('stats-view', cleanRoute === 'stats');
    if (!['history', 'stats'].includes(cleanRoute)) $('statsOverlay')?.classList.remove('active');
    if (cleanRoute === 'settings') {
      $('settingsCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (cleanRoute === 'stats') {
      $('statsBtn')?.click();
      setTimeout(() => { const title = document.querySelector('#statsOverlay .stats-header h2'); if (title) title.textContent = '📊 Thống kê nghe nhạc'; }, 0);
    } else if (cleanRoute === 'history') {
      $('statsBtn')?.click();
      setTimeout(() => { const title = document.querySelector('#statsOverlay .stats-header h2'); if (title) title.textContent = '◷ Lịch sử nghe nhạc'; }, 0);
      setTimeout(() => $('statsHistoryList')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  document.querySelectorAll('[data-route]').forEach((link) => {
    link.addEventListener('click', () => {
      const route = link.dataset.route;
      window.location.hash = `/${route}`;
      setRoute(route);
    });
  });
  window.addEventListener('hashchange', () => setRoute(window.location.hash.replace(/^#\//, '') || 'home'));
  setRoute(window.location.hash.replace(/^#\//, '') || 'home');
  $('statsBtn')?.addEventListener('click', () => {
    if (window.location.hash !== '#/history') {
      body.classList.remove('history-view');
      body.classList.add('stats-view');
      const title = document.querySelector('#statsOverlay .stats-header h2');
      if (title) title.textContent = '📊 Thống kê nghe nhạc';
    }
  });

  const collapsed = localStorage.getItem('musicPlayerShellCollapsed') === '1';
  body.classList.toggle('sidebar-collapsed', collapsed);
  $('sidebarCollapse')?.addEventListener('click', () => {
    const next = !body.classList.contains('sidebar-collapsed');
    body.classList.toggle('sidebar-collapsed', next);
    localStorage.setItem('musicPlayerShellCollapsed', next ? '1' : '0');
  });
  $('mobileNavToggle')?.addEventListener('click', () => body.classList.toggle('mobile-nav-open'));
  document.querySelectorAll('.sidebar-link').forEach((link) => link.addEventListener('click', () => body.classList.remove('mobile-nav-open')));

  $('resumeDismiss')?.addEventListener('click', () => {
    $('resumeBanner')?.classList.add('hidden');
  });

  const savedTheme = localStorage.getItem('musicPlayerShellTheme') || 'dark';
  body.classList.toggle('light-theme', savedTheme === 'light');
  $('sidebarThemeToggle')?.addEventListener('click', () => {
    const light = !body.classList.contains('light-theme');
    body.classList.toggle('light-theme', light);
    localStorage.setItem('musicPlayerShellTheme', light ? 'light' : 'dark');
  });

  const teamToggle = $('teamModeToggle');
  const teamMode = localStorage.getItem('musicPlayerTeamMode') === '1';
  const renderTeamMode = (enabled) => {
    body.classList.toggle('team-mode', enabled);
    if (teamToggle) {
      teamToggle.textContent = `Team mode: ${enabled ? 'ON' : 'OFF'}`;
      teamToggle.classList.toggle('is-on', enabled);
      teamToggle.setAttribute('aria-pressed', String(enabled));
    }
  };
  renderTeamMode(teamMode);
  teamToggle?.addEventListener('click', () => {
    const enabled = !body.classList.contains('team-mode');
    localStorage.setItem('musicPlayerTeamMode', enabled ? '1' : '0');
    renderTeamMode(enabled);
    notify(enabled ? 'Đã bật Team mode' : 'Đã tắt Team mode');
  });

  const placeholder = document.createElement('div');
  placeholder.className = 'right-panel-placeholder';
  const placeholderIcon = document.createElement('div');
  placeholderIcon.style.fontSize = '2rem';
  const placeholderText = document.createElement('div');
  placeholder.append(placeholderIcon, placeholderText);
  colRight?.appendChild(placeholder);
  const setPanel = (panel) => {
    const isQueue = panel === 'queue';
    colRight?.classList.toggle('panel-only-placeholder', !isQueue);
    document.querySelectorAll('[data-panel-tab]').forEach((tab) => tab.classList.toggle('active', tab.dataset.panelTab === panel));
    const labels = {
      queue: ['Queue', '📋', 'Danh sách bài đang chờ phát'],
      lyrics: ['Lyrics', '♪', 'Lyrics sẽ được tích hợp ở Giai đoạn 2'],
      'now-playing': ['Đang phát', '◉', 'Mở Now Playing fullscreen bằng nút ⛶ phía dưới'],
    };
    const [title, icon, text] = labels[panel] || labels.queue;
    $('rightPanelTitle').textContent = title;
    placeholderIcon.textContent = icon;
    placeholderText.textContent = text;
  };
  document.querySelectorAll('[data-panel-tab]').forEach((tab) => tab.addEventListener('click', () => setPanel(tab.dataset.panelTab)));
  setPanel('queue');

  const miniPlay = $('miniPlay');
  const miniPrev = $('miniPrev');
  const miniNext = $('miniNext');
  const miniSeek = $('miniSeek');
  const miniVolume = $('miniVolume');
  miniPlay?.addEventListener('click', () => legacyPlay?.click());
  miniPrev?.addEventListener('click', () => legacyPrev?.click());
  miniNext?.addEventListener('click', () => legacyNext?.click());
  miniVolume?.addEventListener('input', () => {
    if (!legacyVolume) return;
    legacyVolume.value = miniVolume.value;
    legacyVolume.dispatchEvent(new Event('input', { bubbles: true }));
  });
  miniSeek?.addEventListener('input', () => {
    if (audio?.duration) audio.currentTime = (Number(miniSeek.value) / 100) * audio.duration;
  });
  $('miniPanel')?.addEventListener('click', () => {
    const open = !body.classList.contains('right-panel-hidden');
    body.classList.toggle('right-panel-hidden', open);
  });
  $('miniFullscreen')?.addEventListener('click', () => body.classList.toggle('now-playing-focus'));
  $('miniRepeat')?.addEventListener('click', (event) => {
    if (!audio) return;
    audio.loop = !audio.loop;
    event.currentTarget.classList.toggle('is-on', audio.loop);
    notify(audio.loop ? 'Đã bật lặp bài hiện tại' : 'Đã tắt lặp bài hiện tại');
  });
  $('miniShuffle')?.addEventListener('click', (event) => {
    event.currentTarget.classList.toggle('is-on');
    notify(event.currentTarget.classList.contains('is-on') ? 'Shuffle sẽ áp dụng cho queue mới' : 'Đã tắt Shuffle');
  });

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };
  const syncMiniPlayer = () => {
    const title = npContent?.querySelector('.np-title')?.textContent?.trim();
    const artist = npContent?.querySelector('.np-artist')?.textContent?.replace(/^🎤\s*/, '').trim();
    if ($('miniPlayerTitle')) $('miniPlayerTitle').textContent = title || 'Chưa phát bài nào';
    if ($('miniPlayerArtist')) $('miniPlayerArtist').textContent = artist || 'MyMusic Player';
    const cover = npAvatar?.querySelector('img')?.getAttribute('src');
    if (cover && $('miniPlayerCover')) $('miniPlayerCover').src = cover;
    if (miniPlay) miniPlay.textContent = audio && !audio.paused ? 'Ⅱ' : '▶';
    if ($('shellContinueLabel')) $('shellContinueLabel').textContent = title || 'Bài đang phát';
  };
  const syncProgress = () => {
    if (!audio) return;
    const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    if (miniSeek) miniSeek.value = String(percent || 0);
    if ($('miniElapsed')) $('miniElapsed').textContent = formatTime(audio.currentTime);
    if ($('miniDuration')) $('miniDuration').textContent = formatTime(audio.duration);
    syncMiniPlayer();
  };
  ['timeupdate', 'loadedmetadata', 'durationchange', 'play', 'pause', 'ended'].forEach((event) => audio?.addEventListener(event, syncProgress));
  if (npContent) new MutationObserver(syncMiniPlayer).observe(npContent, { childList: true, subtree: true, characterData: true });
  if (npAvatar) new MutationObserver(syncMiniPlayer).observe(npAvatar, { childList: true, subtree: true, attributes: true });
  const syncHomeInsights = () => {
    const playlistText = $('playlistCount')?.textContent?.trim();
    if (playlistText && $('shellPlaylistLabel')) $('shellPlaylistLabel').textContent = playlistText;
    try {
      const history = JSON.parse(localStorage.getItem('mcp_history') || '[]');
      if ($('shellRecentLabel')) $('shellRecentLabel').textContent = history.length ? `${history.length} bài đã nghe` : 'Chưa có lịch sử';
    } catch (_) { /* legacy history may be unavailable */ }
  };
  if ($('playlistCount')) new MutationObserver(syncHomeInsights).observe($('playlistCount'), { childList: true, characterData: true, subtree: true });
  syncHomeInsights();
  syncMiniPlayer();
})();
