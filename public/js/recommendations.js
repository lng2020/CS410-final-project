document.addEventListener('DOMContentLoaded', function () {
  const recommendationsContainer = document.getElementById('recommendationsContainer');

  if (recommendationsContainer) {
    recommendationsContainer.innerHTML = `
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Loading recommendations...</p>
      </div>
    `;

    fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchHistory: JSON.parse(localStorage.getItem('movie_search_history') || '[]'),
        viewHistory: JSON.parse(localStorage.getItem('movie_view_history') || '[]'),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
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
              <h5>No recommendations available</h5>
              <p class="text-muted">Search for movies or view movie details to get personalized recommendations.</p>
            </div>
          `;
          return;
        }

        let html = '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">';
        recommendations.forEach((movie) => {
          html += `
            <div class="col">
              <%- include('partials/recommendation-card', { movie: movie }) %>
            </div>
          `;
        });
        html += '</div>';
        recommendationsContainer.innerHTML = html;
      })
      .catch((error) => {
        console.error('Error fetching recommendations:', error);
        recommendationsContainer.innerHTML = `
          <div class="alert alert-danger">
            Failed to load recommendations. Please try again later.
          </div>
        `;
      });
  }
});