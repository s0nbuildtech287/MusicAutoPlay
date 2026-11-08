/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎵 MYMUSIC WORKSPACE — HOME PORTAL & AUTH CONTROLLER (100% PURE JS & ZERO LAG)
 * 0% CPU, 0% Canvas, Pure Instant Event Listeners & Fast Login
 * Auto-Accepts: xu4ns0n / 123456
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'mymusic_auth';
  const USER_STORAGE_KEY = 'mymusic_user';
  const GUEST_MODE_KEY = 'mymusic_guest_mode';
  const VALID_USER = 'xu4ns0n';
  const VALID_PASS = '123456';

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. INJECT PORTAL DOM
  // ─────────────────────────────────────────────────────────────────────────────
  function injectPortalDOM() {
    if (document.getElementById('myMusicHomePortal')) return;

    // Hide old autoplayOverlay so it never blocks
    const oldGate = document.getElementById('autoplayOverlay');
    if (oldGate) {
      oldGate.style.display = 'none';
      oldGate.classList.add('hidden');
    }

    const overlay = document.createElement('div');
    overlay.id = 'myMusicHomePortal';
    overlay.className = 'home-portal-overlay';
    overlay.innerHTML = `
      <!-- Topbar Navigation -->
      <header class="portal-topbar">
        <div class="portal-brand" id="portalBrandClick">
          <img src="/favicon.png?v=3" alt="MyMusic" class="portal-brand-logo" />
          <div>
            <div class="portal-brand-title">MyMusic <span style="color:#a78bfa;font-weight:400;">Studio</span></div>
            <span class="portal-brand-sub">Intelligent Audio Hub</span>
          </div>
        </div>
        <div class="portal-nav-actions">
          <button type="button" class="portal-btn-sm" id="portalNavDemoBtn">
            <span>Khám phá demo</span> ↗
          </button>
          <button type="button" class="portal-btn-sm" id="portalNavFastBtn" style="border-color:rgba(139,92,246,0.45);color:#c084fc;">
            <span>⚡ 1-Click</span>
          </button>
          <button type="button" class="portal-btn-sm primary" id="portalNavLoginBtn">
            <span>Đăng nhập</span>
          </button>
        </div>
      </header>

      <!-- VIEW 1: HERO LANDING -->
      <main class="portal-container" id="portalHeroView">
        <!-- Left Hero Copy -->
        <section class="portal-hero-left">
          <div class="portal-pill-badge">
            <span class="portal-pill-pulse"></span>
            NEXT-GEN SOUND PLATFORM • V2.5
          </div>
          <h1 class="portal-title">
            Không Gian Âm Nhạc<br/>
            <span class="portal-gradient-text">Đỉnh Cao & Tự Động.</span>
          </h1>
          <p class="portal-desc">
            Trải nghiệm phát nhạc thông minh cho team & cá nhân. Tự động đồng bộ playlist Google Sheet, YouTube Engine chất lượng cao và giao diện âm thanh sống động.
          </p>

          <div class="portal-cta-group">
            <button type="button" class="portal-btn-main primary" id="heroFastLoginBtn">
              <span>⚡ Đăng nhập nhanh</span>
            </button>
            <button type="button" class="portal-btn-main fast" id="heroOpenLoginBtn">
              <span>🔑 Nhập tài khoản</span>
            </button>
            <button type="button" class="portal-btn-main secondary" id="heroDemoBtn">
              <span>Trải nghiệm ngay</span>
            </button>
          </div>

          <div class="portal-specs">
            <div class="portal-spec-item">
              <i>●</i> Auto YouTube 320kbps
            </div>
            <div class="portal-spec-item">
              <i>●</i> Đồng bộ Google Sheet
            </div>
            <div class="portal-spec-item">
              <i>●</i> Realtime 3D Audio Visualizer
            </div>
          </div>
        </section>

        <!-- Right Visual Showcase (Static, Clean & Modern) -->
        <section class="portal-hero-right">
          <div class="portal-vinyl-stage">
            <div class="portal-sound-ring outer"></div>
            <div class="portal-sound-ring"></div>
            <div class="portal-sound-ring glow"></div>

            <div class="portal-vinyl-disc">
              <div class="portal-center-label">
                <img src="/favicon.png?v=3" alt="MyMusic" />
                <span style="font-size:0.65rem;margin-top:4px;font-weight:700;letter-spacing:1px;color:#c084fc;">MYMUSIC</span>
                <div class="portal-center-hole"></div>
              </div>
            </div>

            <div class="portal-feature-tag tag-1">
              <span class="tag-dot"></span>
              YouTube Stream Core
            </div>
            <div class="portal-feature-tag tag-2">
              <span class="tag-dot"></span>
              Live Sheet Sync & Queue
            </div>
            <div class="portal-feature-tag tag-3">
              <span class="tag-dot"></span>
              3D Spatial Audio & EQ
            </div>
          </div>
        </section>
      </main>

      <div class="portal-floating-notes" aria-hidden="true">
        <span>♪</span><span>♫</span><span>♬</span><span>♪</span><span>♫</span><span>♩</span><span>♬</span><span>♪</span>
      </div>

      <div class="portal-bottom-wave" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
      </div>

      <!-- VIEW 2: GLASSMORPHISM LOGIN CARD -->
      <section class="portal-login-modal" id="portalLoginModal" style="display:none;">
        <button type="button" class="portal-back-btn" id="portalLoginBackBtn">
          ← Quay lại trang giới thiệu
        </button>

        <div class="portal-header-block">
          <div class="portal-avatar-glow">
            <img src="/favicon.png?v=3" alt="Logo" />
          </div>
          <h2 class="portal-login-title">Cổng Truy Cập Workspace</h2>
          <p class="portal-login-sub">Đăng nhập để kết nối hệ thống phát nhạc nội bộ</p>
        </div>

        <div id="portalAlertBox" class="portal-alert-box" style="display:none;"></div>

        <form id="portalLoginForm" autocomplete="on">
          <div class="portal-form-field">
            <label for="portalUsernameInput">Tên đăng nhập</label>
            <div class="portal-input-wrapper">
              <span class="portal-input-icon">👤</span>
              <input
                type="text"
                id="portalUsernameInput"
                class="portal-input-control"
                placeholder="Nhập username"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <div class="portal-form-field">
            <label for="portalPasswordInput">Mật khẩu</label>
            <div class="portal-input-wrapper">
              <span class="portal-input-icon">🔒</span>
              <input
                type="password"
                id="portalPasswordInput"
                class="portal-input-control"
                placeholder="Nhập mật khẩu"
                required
                autocomplete="current-password"
              />
              <button type="button" class="portal-toggle-pass" id="portalTogglePassBtn" title="Hiện/ẩn mật khẩu">
                👁️
              </button>
            </div>
          </div>

          <button type="submit" class="portal-submit-btn" id="portalSubmitBtn">
            <span>Đăng nhập hệ thống</span> →
          </button>

          <button type="button" class="portal-fast-btn" id="modalFastLoginBtn">
            <span>⚡ Đăng nhập nhanh</span>
          </button>
        </form>
      </section>
    `;

    document.body.appendChild(overlay);

    const navActions = overlay.querySelector('.portal-nav-actions');
    const registerNav = document.createElement('button');
    registerNav.type = 'button';
    registerNav.id = 'portalNavRegisterBtn';
    registerNav.className = 'portal-btn-sm';
    registerNav.textContent = 'Đăng ký';
    navActions?.appendChild(registerNav);

    const heroActions = overlay.querySelector('.portal-cta-group');
    const registerHero = document.createElement('button');
    registerHero.type = 'button';
    registerHero.id = 'heroRegisterBtn';
    registerHero.className = 'portal-btn-main primary';
    registerHero.textContent = 'Đăng ký tài khoản';
    heroActions?.insertBefore(registerHero, heroActions.firstChild);

    const loginModal = overlay.querySelector('#portalLoginModal');
    loginModal?.insertAdjacentHTML('beforeend', `<form id="portalRegisterForm" autocomplete="on" style="display:none;"><div class="portal-form-field"><label for="portalRegisterUsername">Tên đăng nhập</label><div class="portal-input-wrapper"><span class="portal-input-icon">👤</span><input type="text" id="portalRegisterUsername" class="portal-input-control" placeholder="Tạo username" required autocomplete="username"></div></div><div class="portal-form-field"><label for="portalRegisterPassword">Mật khẩu</label><div class="portal-input-wrapper"><span class="portal-input-icon">🔒</span><input type="password" id="portalRegisterPassword" class="portal-input-control" placeholder="Tối thiểu 4 ký tự" required></div></div><div class="portal-form-field"><label for="portalRegisterConfirm">Xác nhận mật khẩu</label><div class="portal-input-wrapper"><span class="portal-input-icon">✓</span><input type="password" id="portalRegisterConfirm" class="portal-input-control" placeholder="Nhập lại mật khẩu" required></div></div><button type="submit" class="portal-submit-btn">Đăng ký →</button><button type="button" class="portal-fast-btn" id="portalBackToLoginBtn">Đã có tài khoản? Đăng nhập</button></form>`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CONTROLLER & INSTANT EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  function setupPortalEvents() {
    const heroView = document.getElementById('portalHeroView');
    const loginModal = document.getElementById('portalLoginModal');
    const alertBox = document.getElementById('portalAlertBox');
    const userField = document.getElementById('portalUsernameInput');
    const passField = document.getElementById('portalPasswordInput');
    const form = document.getElementById('portalLoginForm');
    const registerForm = document.getElementById('portalRegisterForm');
    const togglePass = document.getElementById('portalTogglePassBtn');
    const fillPreset = document.getElementById('fillPresetBtn');

    function showHero() {
      if (heroView) heroView.style.display = 'grid';
      if (loginModal) loginModal.style.display = 'none';
      if (alertBox) alertBox.style.display = 'none';
    }

    function showLogin() {
      if (heroView) heroView.style.display = 'none';
      if (loginModal) loginModal.style.display = 'block';
      if (form) form.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
      if (userField) {
        userField.focus();
        userField.select();
      }
    }

    function showRegister() {
      if (heroView) heroView.style.display = 'none';
      if (loginModal) loginModal.style.display = 'block';
      if (form) form.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
      document.getElementById('portalRegisterUsername')?.focus();
    }

    function showAlert(msg, isError = true) {
      if (!alertBox) return;
      alertBox.textContent = msg;
      alertBox.className = `portal-alert-box ${isError ? 'error' : 'success'}`;
      alertBox.style.display = 'flex';
    }

    // Toggle password
    if (togglePass && passField) {
      togglePass.onclick = (e) => {
        e.preventDefault();
        const isPass = passField.type === 'password';
        passField.type = isPass ? 'text' : 'password';
        togglePass.textContent = isPass ? '🙈' : '👁️';
      };
    }

    // Quick fill preset
    if (fillPreset && userField && passField) {
      fillPreset.onclick = (e) => {
        e.preventDefault();
        userField.value = VALID_USER;
        passField.value = VALID_PASS;
        showAlert('✨ Đã điền sẵn tài khoản & mật khẩu mẫu!', false);
      };
    }

    // Nav & Hero buttons
    const navLoginBtn = document.getElementById('portalNavLoginBtn');
    const heroOpenLoginBtn = document.getElementById('heroOpenLoginBtn');
    const navRegisterBtn = document.getElementById('portalNavRegisterBtn');
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    const loginBackBtn = document.getElementById('portalLoginBackBtn');

    if (navLoginBtn) navLoginBtn.onclick = showLogin;
    if (heroOpenLoginBtn) heroOpenLoginBtn.onclick = showLogin;
    if (navRegisterBtn) navRegisterBtn.onclick = showRegister;
    if (heroRegisterBtn) heroRegisterBtn.onclick = showRegister;
    if (loginBackBtn) loginBackBtn.onclick = showHero;

    registerForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = document.getElementById('portalRegisterUsername')?.value.trim() || '';
      const password = document.getElementById('portalRegisterPassword')?.value || '';
      const confirmPassword = document.getElementById('portalRegisterConfirm')?.value || '';
      if (username.length < 3) return showAlert('Tên đăng nhập cần ít nhất 3 ký tự!');
      if (password.length < 4) return showAlert('Mật khẩu cần ít nhất 4 ký tự!');
      if (password !== confirmPassword) return showAlert('Mật khẩu xác nhận không khớp!');
      const accounts = JSON.parse(localStorage.getItem('mymusic_accounts') || '{}');
      if (accounts[username]) return showAlert('Tên đăng nhập đã tồn tại!');
      fetch(window.MUSIC_SHEET_API || 'https://script.google.com/macros/s/AKfycbyFGVPMlMRFwzCXF9BYd_xJeQqFGn51dXuiP9NBS4fag2RHp-4IG5MOkXsrWJJLR0v0hQ/exec', {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'register', userId: username, displayName: username, password })
      }).catch(error => console.warn('Không thể đồng bộ tài khoản lên Sheet:', error));
      accounts[username] = { password, createdAt: new Date().toISOString() };
      localStorage.setItem('mymusic_accounts', JSON.stringify(accounts));
      showAlert('Đăng ký thành công, đang đăng nhập...', false);
      performLogin(username, password);
    });
    document.getElementById('portalBackToLoginBtn')?.addEventListener('click', showLogin);

    function doFastLogin(e) {
      if (e) e.preventDefault();
      if (userField) userField.value = VALID_USER;
      if (passField) passField.value = VALID_PASS;
      performLogin(VALID_USER, VALID_PASS);
    }

    const navFastBtn = document.getElementById('portalNavFastBtn');
    const heroFastBtn = document.getElementById('heroFastLoginBtn');
    const modalFastBtn = document.getElementById('modalFastLoginBtn');

    if (navFastBtn) navFastBtn.onclick = doFastLogin;
    if (heroFastBtn) heroFastBtn.onclick = doFastLogin;
    if (modalFastBtn) modalFastBtn.onclick = doFastLogin;

    function enterDemoMode(e) {
      if (e) e.preventDefault();
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.setItem(GUEST_MODE_KEY, '1');
      unlockPlayerAndDismiss('Guest');
    }

    const navDemoBtn = document.getElementById('portalNavDemoBtn');
    const heroDemoBtn = document.getElementById('heroDemoBtn');
    if (navDemoBtn) navDemoBtn.onclick = enterDemoMode;
    if (heroDemoBtn) heroDemoBtn.onclick = enterDemoMode;

    // Form submit
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const username = userField ? userField.value.trim() : '';
        const password = passField ? passField.value.trim() : '';

        // Auto accept xu4ns0n / 123456
        if (
          (username.toLowerCase() === VALID_USER && password === VALID_PASS) ||
          (username !== '' && password.length >= 4)
        ) {
          performLogin(username, password);
        } else {
          showAlert('❌ Tên đăng nhập hoặc mật khẩu không chính xác!');
        }
      };
    }

    function performLogin(username, password) {
      const u = username || VALID_USER;
      localStorage.removeItem(GUEST_MODE_KEY);
      localStorage.setItem(AUTH_STORAGE_KEY, '1');
      localStorage.setItem(USER_STORAGE_KEY, u);
      unlockPlayerAndDismiss(u);
      window.bootstrapMusicLibrary?.();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. UNLOCK MAIN PLAYER & DISMISS PORTAL
  // ─────────────────────────────────────────────────────────────────────────────
  function unlockPlayerAndDismiss(username) {
    const overlay = document.getElementById('myMusicHomePortal');
    if (overlay) {
      overlay.classList.add('hidden');
    }

    // Trigger audio unlock on startBtn
    const startBtn = document.getElementById('startBtn');
    const autoplayOverlay = document.getElementById('autoplayOverlay');
    if (autoplayOverlay) {
      autoplayOverlay.style.display = 'none';
      autoplayOverlay.classList.add('hidden');
    }
    if (startBtn) {
      try { startBtn.click(); } catch (_) {}
    }

    // Mount user badge in header
    mountHeaderUserBadge(username);

    // Toast
    if (typeof window.toast === 'function') {
      window.toast(`👋 Chào mừng ${username} đến với MyMusic Studio!`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. USER PROFILE BADGE & LOGOUT BUTTON
  // ─────────────────────────────────────────────────────────────────────────────
  function mountHeaderUserBadge(username) {
    const effectiveUser = username || localStorage.getItem(USER_STORAGE_KEY) || VALID_USER;
    let badge = document.getElementById('headerUserProfile');

    if (!badge) {
      const headerActions = document.querySelector('.app-header .header-actions');
      if (!headerActions) return;

      badge = document.createElement('div');
      badge.id = 'headerUserProfile';
      badge.className = 'header-user-profile';
      headerActions.appendChild(badge);
    }

    const initial = effectiveUser.charAt(0).toUpperCase();
    badge.innerHTML = `
      <div class="header-user-avatar" title="${effectiveUser}">${initial}</div>
      <span style="font-weight:700;">${effectiveUser}</span>
      <button type="button" class="header-logout-btn" id="headerLogoutBtn" title="Đăng xuất khỏi MyMusic">
        🚪
      </button>
    `;

    const logoutBtn = document.getElementById('headerLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = function (e) {
        e.stopPropagation();
        doLogout();
      };
    }
  }

  function doLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(GUEST_MODE_KEY);

    const badge = document.getElementById('headerUserProfile');
    if (badge) badge.remove();

    const overlay = document.getElementById('myMusicHomePortal');
    if (overlay) {
      overlay.classList.remove('hidden');
      const heroView = document.getElementById('portalHeroView');
      const loginModal = document.getElementById('portalLoginModal');
      if (heroView) heroView.style.display = 'grid';
      if (loginModal) loginModal.style.display = 'none';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. INITIALIZATION RUNNER
  // ─────────────────────────────────────────────────────────────────────────────
  function init() {
    injectPortalDOM();
    setupPortalEvents();

    const forceIntro = new URLSearchParams(window.location.search).get('intro') === '1';
    const isGuest = localStorage.getItem(GUEST_MODE_KEY) === '1';
    const isAuthed = !forceIntro && (localStorage.getItem(AUTH_STORAGE_KEY) === '1' || isGuest);
    const savedUser = isGuest ? 'Guest' : (localStorage.getItem(USER_STORAGE_KEY) || VALID_USER);
    const overlay = document.getElementById('myMusicHomePortal');

    if (isAuthed) {
      if (overlay) overlay.classList.add('hidden');
      mountHeaderUserBadge(savedUser);
      const autoplayOverlay = document.getElementById('autoplayOverlay');
      if (autoplayOverlay) {
        autoplayOverlay.style.display = 'none';
        autoplayOverlay.classList.add('hidden');
      }
    } else {
      if (overlay) overlay.classList.remove('hidden');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
