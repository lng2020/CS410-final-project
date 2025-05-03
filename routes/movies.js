const express = require('express');
const router = express.Router();
const weaviate = require("weaviate-client");
require('dotenv').config();

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
  header: {
    "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY || ""
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    
    const movieQuery = await client.graphql
      .get()
      .withClassName('Movies')
      .withFields(['title', 'genres', 'overview', 'popularity', 'runtime', 'tagline', 'cast', 'director', 'revenue', 'language', 'keywords', 'movie_id', '_additional { id certainty }'])
      .withWhere({
        path: ["movie_id"],
        operator: "Equal",
        valueNumber: parseInt(id)
      })
      .do();
    
    if (!movieQuery.data.Get.Movies.length) {
      return res.status(404).render('error', { 
        message: 'Movie not found',
        error: { status: 404 }
      });
    }
    
    const movie = movieQuery.data.Get.Movies[0];
    
    const similarQuery = await client.graphql
      .get()
      .withClassName('Movies')
      .withFields(['movie_id', 'title', 'genres', 'overview', 'popularity', 'runtime', 'tagline'])
      .withNearObject({
        movie_id: movieId,
        certainty: 0.7
      })
      .withLimit(6)
      .do();
    
    const similarMovies = similarQuery.data.Get.Movies;
    
    res.render('movie', {
      title: `${movie.title} - MovieLens`,
      movie: movie,
      similarMovies: similarMovies
    });
  } catch (err) {
    console.error('Error fetching movie details:', err);
    res.status(500).render('error', { 
      message: 'Error fetching movie details',
      error: { status: 500 }
    });
  }
});

module.exports = router;