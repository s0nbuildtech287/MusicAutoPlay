// ═══════════════════════════════════════════════════════
//  🔍 SEARCH FEATURE
// ═══════════════════════════════════════════════════════

// Search state (sẽ được merge vào state chính)
const searchState = {
  query: '',
  filteredResults: []
};

// ═══════════════════════════════════════════════════════
//  SEARCH FUNCTIONS
// ═══════════════════════════════════════════════════════

function performSearch(query, playlist) {
  searchState.query = query.trim();
  
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  const resultsInfo = document.getElementById('searchResultsInfo');
  
  if (!searchState.query) {
    // Clear search
    searchState.filteredResults = [];
    if (clearBtn) clearBtn.classList.remove('visible');
    if (resultsInfo) resultsInfo.classList.remove('visible');
    return null; // Return null = show full playlist
  }
  
  // Show clear button
  if (clearBtn) clearBtn.classList.add('visible');
  
  // Filter playlist (case-insensitive)
  const q = searchState.query.toLowerCase();
  searchState.filteredResults = playlist.filter(song => {
    return song.title.toLowerCase().includes(q) ||
           song.artist.toLowerCase().includes(q) ||
           song.name.toLowerCase().includes(q);
  });
  
  // Show results info
  if (resultsInfo) {
    const count = searchState.filteredResults.length;
    resultsInfo.textContent = count > 0 
      ? `✨ Tìm thấy ${count} bài` 
      : `Không tìm thấy "${searchState.query}"`;
    resultsInfo.classList.add('visible');
  }
  
  return searchState.filteredResults;
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  const resultsInfo = document.getElementById('searchResultsInfo');
  
  if (searchInput) searchInput.value = '';
  searchState.query = '';
  searchState.filteredResults = [];
  
  if (clearBtn) clearBtn.classList.remove('visible');
  if (resultsInfo) resultsInfo.classList.remove('visible');
  
  // Trigger rerender (dispatch custom event)
  window.dispatchEvent(new CustomEvent('searchCleared'));
  
  return null; // Return null = show full playlist
}

function getSearchQuery() {
  return searchState.query;
}

function getSearchResults() {
  return searchState.filteredResults;
}

function hasActiveSearch() {
  return searchState.query.length > 0;
}

// ═══════════════════════════════════════════════════════
//  EVENT LISTENERS SETUP
// ═══════════════════════════════════════════════════════

function initSearchFeature() {
  console.log('🔍 Search feature loaded!');
  
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  
  if (searchInput) {
    // Realtime search on input
    searchInput.addEventListener('input', (e) => {
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { query: e.target.value } 
      }));
    });
    
    // Clear on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', clearSearch);
  }
  
  console.log('✅ Search feature initialized');
}

// ═══════════════════════════════════════════════════════
//  KEYBOARD SHORTCUT (Ctrl+F)
// ═══════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // Ctrl+F or Cmd+F = Focus Search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
});

// ═══════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearchFeature);
} else {
  initSearchFeature();
}

// Export functions for use in main script
window.SearchFeature = {
  performSearch,
  clearSearch,
  getSearchQuery,
  getSearchResults,
  hasActiveSearch
};
