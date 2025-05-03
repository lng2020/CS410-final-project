const UserHistory = {
    MAX_SEARCH_HISTORY: 20,
    MAX_VIEW_HISTORY: 15,
    
    SEARCH_HISTORY_KEY: 'movie_search_history',
    VIEW_HISTORY_KEY: 'movie_view_history',
    
    init: function() {
      try {
        this.searchHistory = JSON.parse(localStorage.getItem(this.SEARCH_HISTORY_KEY)) || [];
      } catch (e) {
        console.error('Error loading search history:', e);
        this.searchHistory = [];
      }
      
      try {
        this.viewHistory = JSON.parse(localStorage.getItem(this.VIEW_HISTORY_KEY)) || [];
      } catch (e) {
        console.error('Error loading view history:', e);
        this.viewHistory = [];
      }
      
      this.updateHistoryUI();
      this.loadRecommendations();
    },
    
    addSearch: function(term, type) {
      if (!term || term.trim() === '') return;
      
      this.searchHistory.push({
        term: term,
        type: type || 'semantic',
        timestamp: Date.now()
      });
      
      if (this.searchHistory.length > this.MAX_SEARCH_HISTORY) {
        this.searchHistory = this.searchHistory.slice(-this.MAX_SEARCH_HISTORY);
      }
      
      localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
      
      this.updateHistoryUI();
      this.loadRecommendations();
    },
    
    addView: function(movie) {
      if (!movie || !movie.movie_id) return;

      const existingIndex = this.viewHistory.findIndex(item => item.movie_id === movie.movie_id);

      if (existingIndex >= 0) {
        const existing = this.viewHistory.splice(existingIndex, 1)[0];
        existing.timestamp = Date.now();
        this.viewHistory.push(existing);
      } else {
        this.viewHistory.push({
          movie_id: movie.movie_id,
          title: movie.title,
          timestamp: Date.now()
        });
      }
      
      if (this.viewHistory.length > this.MAX_VIEW_HISTORY) {
        this.viewHistory = this.viewHistory.slice(-this.MAX_VIEW_HISTORY);
      }
      
      localStorage.setItem(this.VIEW_HISTORY_KEY, JSON.stringify(this.viewHistory));
      
      this.updateHistoryUI();
      this.loadRecommendations();
    },
    
    clearHistory: function() {
      if (confirm('Are you sure you want to clear your search and viewing history?')) {
        this.searchHistory = [];
        this.viewHistory = [];
        
        localStorage.removeItem(this.SEARCH_HISTORY_KEY);
        localStorage.removeItem(this.VIEW_HISTORY_KEY);
        
        this.updateHistoryUI();
        this.loadRecommendations();
      }
    },
    
    formatTime: function(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      
      if (diff < 60000) {
        return 'just now';
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + 'm ago';
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + 'h ago';
      } else {
        return Math.floor(diff / 86400000) + 'd ago';
      }
    },
    
    updateHistoryUI: function() {
      const searchHistoryContainer = document.getElementById('searchHistoryList');
      if (searchHistoryContainer) {
        if (this.searchHistory.length === 0) {
          searchHistoryContainer.innerHTML = '<li class="list-group-item text-center text-muted">No search history</li>';
        } else {
          const sortedHistory = [...this.searchHistory].reverse();
          
          let html = '';
          sortedHistory.forEach(item => {
            const searchTypeIcon = this.getSearchTypeIcon(item.type);
            html += `
              <li class="list-group-item d-flex justify-content-between align-items-center search-history-item" 
                  onclick="performSearch('${item.term}', '${item.type}')">
                <div>
                  <span class="search-type-badge">${searchTypeIcon}</span>
                  <span class="search-term">${item.term}</span>
                </div>
                <small class="text-muted">${this.formatTime(item.timestamp)}</small>
              </li>
            `;
          });
          
          searchHistoryContainer.innerHTML = html;
        }
      }
      
      const viewHistoryContainer = document.getElementById('viewHistoryList');
      if (viewHistoryContainer) {
        if (this.viewHistory.length === 0) {
          viewHistoryContainer.innerHTML = '<li class="list-group-item text-center text-muted">No viewing history</li>';
        } else {
          const sortedViews = [...this.viewHistory].reverse();
          
          let html = '';
          sortedViews.forEach(item => {
            html += `
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <span class="view-title">${item.title}</span>
                <small class="text-muted">${this.formatTime(item.timestamp)}</small>
              </li>
            `;
          });
          
          viewHistoryContainer.innerHTML = html;
        }
      }
      
      const searchCountBadge = document.getElementById('searchHistoryCount');
      if (searchCountBadge) {
        searchCountBadge.textContent = this.searchHistory.length;
      }
      
      const viewCountBadge = document.getElementById('viewHistoryCount');
      if (viewCountBadge) {
        viewCountBadge.textContent = this.viewHistory.length;
      }
    },
    
    getSearchTypeIcon: function(type) {
      switch (type) {
        case 'keyword':
          return '<i class="fas fa-font" title="Keyword Search"></i>';
        case 'semantic':
          return '<i class="fas fa-brain" title="Semantic Search"></i>';
        case 'hybrid':
        return '<i class="fas fa-exchange-alt" title="Hybrid Search"></i>';
      default:
        return '<i class="fas fa-search" title="Search"></i>';
    }
  },
  
  loadRecommendations: function() {
    const recommendationsContainer = document.getElementById('recommendationsContainer');
    if (!recommendationsContainer) return;
    
    recommendationsContainer.innerHTML = `
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Generating personalized recommendations...</p>
      </div>
    `;
    
    fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchHistory: this.searchHistory,
        viewHistory: this.viewHistory
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        recommendationsContainer.innerHTML = `
          <div class="alert alert-danger">
            ${data.error}
          </div>
        `;
        return;
      }
      
      const recommendations = data.recommendations || [];
      
      if (recommendations.length === 0) {
        recommendationsContainer.innerHTML = `
          <div class="text-center p-4">
            <i class="fas fa-film fa-3x mb-3 text-muted"></i>
            <h5>No recommendations yet</h5>
            <p class="text-muted">Search for movies or view movie details to get personalized recommendations.</p>
          </div>
        `;
        return;
      }
      
      let html = `
        <h5 class="mb-3">
          ${data.source === 'popularity' ? 
            '<i class="fas fa-fire me-2"></i>Popular Movies' : 
            '<i class="fas fa-magic me-2"></i>Personalized Recommendations'}
        </h5>
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
      `;
      
      recommendations.forEach(movie => {
        html += `
          <div class="col">
            <div class="movie-card">
              <div class="card-img-top d-flex align-items-center justify-content-center">
                <i class="fas fa-film fa-3x text-secondary"></i>
              </div>
              <div class="card-body">
                <h6 class="movie-title">${movie.title}</h6>
                
                <div class="mb-2">
                  ${movie.genres ? formatGenreBadges(movie.genres) : ''}
                </div>
                
                <div class="movie-meta mb-2">
                  ${movie.runtime ? `<span class="me-3"><i class="fas fa-clock movie-info-icon"></i>${movie.runtime} min</span>` : ''}
                  ${movie.popularity ? `<span><i class="fas fa-fire movie-info-icon"></i>${parseFloat(movie.popularity).toFixed(1)}</span>` : ''}
                </div>
                
                <button class="btn btn-primary btn-sm w-100" onclick="viewMovieDetails('${movie.id}')">
                  <i class="fas fa-info-circle me-1"></i>View Details
                </button>
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      recommendationsContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('Error fetching recommendations:', error);
      recommendationsContainer.innerHTML = `
        <div class="alert alert-danger">
          Failed to load recommendations. Please try again later.
        </div>
      `;
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  UserHistory.init();
  
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
      const searchInput = document.getElementById('searchInput');
      const searchTypeSelect = document.getElementById('searchType');
      
      if (searchInput && searchTypeSelect) {
        UserHistory.addSearch(searchInput.value, searchTypeSelect.value);
      }
    });
  }
});

function formatGenreBadges(genres) {
  if (!genres) return '';
  
  const genreList = typeof genres === 'string' ? genres.split(',') : genres;
  let html = '';
  
  genreList.slice(0, 3).forEach(genre => {
    html += `<span class="genre-badge">${genre.trim()}</span>`;
  });
  
  if (genreList.length > 3) {
    html += `<span class="genre-badge">+${genreList.length - 3}</span>`;
  }
  
  return html;
}

function performSearch(term, type) {
  const searchInput = document.getElementById('searchInput');
  const searchTypeSelect = document.getElementById('searchType');
  const searchForm = document.getElementById('searchForm');
  
  if (searchInput && searchTypeSelect && searchForm) {
    searchInput.value = term;
    searchTypeSelect.value = type;
    searchForm.submit();
  }
}

function viewMovieDetails(movieId) {
  fetch(`/api/movies/${movieId}`)
    .then(response => response.json())
    .then(movie => {
      UserHistory.addView(movie);
      
      const movieModal = document.getElementById(`movieModal${movieId}`);
      if (movieModal) {
        const modal = new bootstrap.Modal(movieModal);
        modal.show();
      } else {
        window.location.href = `/movies/${movieId}`;
      }
    })
    .catch(error => {
      console.error('Error fetching movie details:', error);
    });
}