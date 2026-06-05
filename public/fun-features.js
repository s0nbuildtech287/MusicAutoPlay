// ═══════════════════════════════════════════════════════
//  🎉 FUN FEATURES
// ═══════════════════════════════════════════════════════

// Party Mode State
let partyModeActive = false;
let partyInterval = null;
let logoClickCount = 0;
let logoClickTimer = null;
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

// Stats for achievements
let songsPlayed = 0;

// ═══════════════════════════════════════════════════════
//  CONFETTI EFFECT
// ═══════════════════════════════════════════════════════
function createConfetti() {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confetti.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3500);
    }, i * 30);
  }
}

// ═══════════════════════════════════════════════════════
//  PARTY MODE
// ═══════════════════════════════════════════════════════
function togglePartyMode() {
  partyModeActive = !partyModeActive;
  const btn = document.getElementById('partyBtn');
  const avatar = document.getElementById('npAvatar');

  if (partyModeActive) {
    // Activate party mode
    document.body.classList.add('party-mode');
    btn.classList.add('active');
    btn.textContent = '🎊 Party ON!';
    
    // Confetti burst
    createConfetti();
    
    // Speed up spinning
    if (avatar) {
      avatar.style.animation = 'spin-slow 2s linear infinite';
    }
    
    // Periodic confetti
    partyInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        createConfetti();
      }
    }, 3000);
    
    toast('🎉 Party Mode ACTIVATED!');
  } else {
    // Deactivate party mode
    document.body.classList.remove('party-mode');
    btn.classList.remove('active');
    btn.textContent = '🎉 Party Mode';
    
    if (partyInterval) {
      clearInterval(partyInterval);
      partyInterval = null;
    }
    
    if (avatar) {
      avatar.style.animation = 'spin-slow 8s linear infinite';
    }
    
    toast('Party Mode OFF');
  }
}

// ═══════════════════════════════════════════════════════
//  BOSS MODE (Hide app quickly)
// ═══════════════════════════════════════════════════════
let bossMode = false;

function toggleBossMode() {
  bossMode = !bossMode;
  if (bossMode) {
    document.body.classList.add('boss-mode');
    // Pause audio
    const audio = document.getElementById('audioEl');
    if (audio) audio.pause();
  } else {
    document.body.classList.remove('boss-mode');
  }
}

// ═══════════════════════════════════════════════════════
//  DESKTOP NOTIFICATIONS
// ═══════════════════════════════════════════════════════
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showNotification(title, body, icon) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: icon || '/favicon.png',
      tag: 'music-player',
      requireInteraction: false
    });

    notification.onclick = function() {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  }
}

// ═══════════════════════════════════════════════════════
//  ACHIEVEMENT SYSTEM
// ═══════════════════════════════════════════════════════
function showAchievement(title, description) {
  const achievement = document.createElement('div');
  achievement.className = 'achievement';
  achievement.innerHTML = `
    <div style="font-size:1.5rem;margin-bottom:4px;">🏆</div>
    <div style="font-weight:700;">${title}</div>
    <div style="font-size:0.75rem;color:#555;margin-top:2px;">${description}</div>
  `;
  document.body.appendChild(achievement);

  setTimeout(() => achievement.remove(), 4000);
}

function checkAchievements() {
  // Achievement: First song
  if (songsPlayed === 1) {
    showAchievement('🎵 First Song!', 'Bạn vừa nghe bài đầu tiên');
  }
  
  // Achievement: 10 songs
  if (songsPlayed === 10) {
    showAchievement('🔥 Music Fan', 'Đã nghe 10 bài hát!');
  }
  
  // Achievement: 50 songs
  if (songsPlayed === 50) {
    showAchievement('🌟 Music Lover', 'Đã nghe 50 bài hát!');
  }
  
  // Achievement: 100 songs
  if (songsPlayed === 100) {
    showAchievement('👑 Music Master', 'Đã nghe 100 bài hát!');
    createConfetti();
  }
}

// ═══════════════════════════════════════════════════════
//  EASTER EGGS
// ═══════════════════════════════════════════════════════

// Easter Egg 1: Click logo 10 times
function setupLogoEasterEgg() {
  const logo = document.getElementById('logo');
  if (!logo) return;
  
  logo.addEventListener('click', () => {
    logoClickCount++;
    
    if (logoClickTimer) clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => {
      logoClickCount = 0;
    }, 2000);
    
    if (logoClickCount === 10) {
      showAchievement('🌈 Rainbow Mode!', 'Secret unlocked!');
      togglePartyMode();
      createConfetti();
      logoClickCount = 0;
    }
  });
}

// Easter Egg 2: Konami Code
function setupKonamiCode() {
  document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
      showAchievement('🎮 Konami Code!', 'You are a legend!');
      createConfetti();
      togglePartyMode();
      
      // Reset
      konamiCode = [];
    }
  });
}

// ═══════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input (except Ctrl+F which is handled by search-feature.js)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Ctrl+B or Cmd+B = Boss Mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleBossMode();
      return;
    }
    
    // Space = Play/Pause
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      const playBtn = document.getElementById('playPauseBtn');
      if (playBtn) playBtn.click();
      return;
    }
    
    // Arrow Right = Next
    if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey) {
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn) nextBtn.click();
      return;
    }
    
    // Arrow Left = Previous
    if (e.key === 'ArrowLeft' && !e.shiftKey && !e.ctrlKey) {
      const prevBtn = document.getElementById('prevBtn');
      if (prevBtn) prevBtn.click();
      return;
    }
    
    // Arrow Up = Volume up
    if (e.key === 'ArrowUp' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      const volSlider = document.getElementById('volSlider');
      if (volSlider) {
        volSlider.value = Math.min(100, parseInt(volSlider.value) + 10);
        volSlider.dispatchEvent(new Event('input'));
      }
      return;
    }
    
    // Arrow Down = Volume down
    if (e.key === 'ArrowDown' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      const volSlider = document.getElementById('volSlider');
      if (volSlider) {
        volSlider.value = Math.max(0, parseInt(volSlider.value) - 10);
        volSlider.dispatchEvent(new Event('input'));
      }
      return;
    }
  });
}

// ═══════════════════════════════════════════════════════
//  HOOK INTO EXISTING FUNCTIONS
// ═══════════════════════════════════════════════════════

// Hook into song play to trigger notifications and achievements
window.addEventListener('songStarted', (e) => {
  const song = e.detail;
  
  // Increment counter
  songsPlayed++;
  
  // Confetti on first song or milestones
  if (songsPlayed === 1 || songsPlayed % 25 === 0) {
    createConfetti();
  }
  
  // Show notification
  showNotification(
    `🎵 ${song.title}`,
    `${song.artist} - ${song.name}`,
    '/favicon.png'
  );
  
  // Check achievements
  checkAchievements();
});

// ═══════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════
function initFunFeatures() {
  console.log('🎉 Fun Features loaded!');
  
  // Request notification permission
  requestNotificationPermission();
  
  // Setup Easter Eggs
  setupLogoEasterEgg();
  setupKonamiCode();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Party Mode button
  const partyBtn = document.getElementById('partyBtn');
  if (partyBtn) {
    partyBtn.addEventListener('click', togglePartyMode);
  }
  
  // Load stats from localStorage
  const savedStats = localStorage.getItem('musicPlayerStats');
  if (savedStats) {
    try {
      const stats = JSON.parse(savedStats);
      songsPlayed = stats.songsPlayed || 0;
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }
  
  // Save stats periodically
  setInterval(() => {
    localStorage.setItem('musicPlayerStats', JSON.stringify({
      songsPlayed: songsPlayed
    }));
  }, 30000); // Every 30 seconds
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFunFeatures);
} else {
  initFunFeatures();
}
