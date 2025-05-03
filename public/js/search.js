function getSimilarMovies(movieId, containerId) {
    const container = document.getElementById(containerId || 'similarMoviesResult');
    container.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading similar movies...</p></div>';
    
    fetch('/api/similar/' + movieId)
      .then(response => response.json())
      .then(data => {
        let html = '<div class="history-panel"><h5 class="p-3 border-bottom"><i class="fas fa-magic me-2"></i>Similar Movies</h5>';
        
        if (data.length === 0) {
          html += '<p class="text-center p-3">No similar movies found.</p>';
        } else {
          html += '<div class="list-group list-group-flush">';
          data.forEach(movie => {
            html += `
              <a href="/movies/${movie.id}" class="list-group-item list-group-item-action">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-0">${movie.title}</h6>
                    <small class="text-muted">${movie.genres || ''}</small>
                  </div>
                  <span class="badge bg-primary rounded-pill">${movie.runtime ? movie.runtime + 'm' : 'N/A'}</span>
                </div>
              </a>
            `;
          });
          html += '</div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
      })
      .catch(error => {
        container.innerHTML = '<div class="alert alert-danger">Error loading similar movies.</div>';
        console.error('Error:', error);
      });
  }
  
  function changePage(page) {
    const form = document.querySelector('#searchForm');
    const pageInput = form.querySelector('input[name="page"]');
    pageInput.value = page;
    form.submit();
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