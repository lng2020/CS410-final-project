const { parse } = require('dotenv');
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

router.get('/similar/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    
    const movieQuery = await client.graphql
      .get()
      .withClassName('Movies')
      .withFields(['title'])
      .withWhere({
        path: ["movie_id"],
        operator: "Equal",
        valueNumber: parseInt(movieId)
      })
      .do();
    
    const movie = movieQuery.data.Get.Movies[0];
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    const similarMovies = await client.graphql
      .get()
      .withClassName('Movies')
      .withFields(['movie_id', 'title', 'genres', 'overview', 'popularity', 'runtime', 'tagline'])
      .withNearObject({
        id: movie._additional.id,
        certainty: 0.7
      })
      .withLimit(5)
      .do();
    
    res.json(similarMovies.data.Get.Movies);
  } catch (err) {
    console.error('Error fetching similar movies:', err);
    res.status(500).json({ error: 'Failed to fetch similar movies' });
  }
});

router.get('/movies/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    
    const movieQuery = await client.graphql
      .get()
      .withClassName('Movies')
      .withFields(['movie_id', 'title', 'genres', 'overview', 'popularity', 'runtime', 'tagline', 'cast', 'director', 'revenue', 'language', 'keywords'])
      .withWhere({
        path: ["movie_id"],
        operator: "Equal",
        valueNumber: parseInt(movieId)
      })
      .do();
    
    const movie = movieQuery.data.Get.Movies[0];
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (err) {
    console.error('Error fetching movie details:', err);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

router.post('/recommendations', async (req, res) => {
  try {
    const searchHistory = req.body.searchHistory || [];
    const viewHistory = req.body.viewHistory || [];
    
    if (searchHistory.length === 0 && viewHistory.length === 0) {
      const popularMovies = await client.graphql
        .get()
        .withClassName('Movies')
        .withFields(['movie_id', 'title', 'genres', 'overview', 'popularity', 'runtime', 'tagline', 'cast', 'director'])
        .withSort({ path: ["popularity"], order: "desc" })
        .withLimit(10)
        .do();
      
      return res.json({
        recommendations: popularMovies.data.Get.Movies,
        source: 'popularity'
      });
    }
    
    const concepts = [];
    
    searchHistory.slice(-10).forEach((item, index) => {
      concepts.push({
        concept: item.term,
        weight: 0.5 + (index / 20)
      });
    });
    
    viewHistory.slice(-5).forEach((item, index) => {
      concepts.push({
        concept: item.title,
        weight: 0.7 + (index / 10)
      });
    });
    
    const recommendedMovies = await client.graphql
      .get()
      .withClassName('Movies')
      .withFields(['movie_id', 'title', 'genres', 'overview', 'popularity', 'runtime', 'tagline', 'cast', 'director'])
      .withNearText({
        concepts: concepts.map(c => c.concept),
        certainty: 0.6
      })
      .withLimit(10)
      .do();
    
    const viewedIds = viewHistory.map(item => item.movie_id); // Change id to movie_id
    const filteredRecommendations = recommendedMovies.data.Get.Movies.filter(
      movie => !viewedIds.includes(movie.movie_id) // Change id to movie_id
    );
    
    res.json({
      recommendations: filteredRecommendations,
      source: 'history'
    });
  } catch (err) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;