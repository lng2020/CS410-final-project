const express = require('express');
const router = express.Router();
const weaviate = require("weaviate-client");

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

function buildFilter(queryParams) {
  const filters = [];
  
  if (queryParams.genre && queryParams.genre !== 'all') {
    filters.push({
      path: ["genres"],
      operator: "ContainsAny",
      valueString: queryParams.genre
    });
  }
  
  if (queryParams.minRuntime) {
    filters.push({
      path: ["runtime"],
      operator: "GreaterThanEqual",
      valueNumber: parseInt(queryParams.minRuntime)
    });
  }
  
  if (queryParams.maxRuntime) {
    filters.push({
      path: ["runtime"],
      operator: "LessThanEqual",
      valueNumber: parseInt(queryParams.maxRuntime)
    });
  }
  
  if (queryParams.minPopularity) {
    filters.push({
      path: ["popularity"],
      operator: "GreaterThanEqual",
      valueNumber: parseFloat(queryParams.minPopularity)
    });
  }
  
  return filters.length > 0 ? { operator: "And", operands: filters } : null;
}

router.get('/genres', async (req, res) => {
  try {
    const result = await client.graphql
      .aggregate()
      .withClassName('Movies')
      .withFields('genres { count }')
      .do();
    
    const genres = result.data.Aggregate.Movies.groupedBy.genres;
    
    res.json(genres);
  } catch (err) {
    console.error('Error fetching genres:', err);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

router.get('/', (req, res) => {
  res.render('search', { movie_info: [], searchText: '' });
});

router.post('/', async (req, res) => {
  try {
    const searchText = req.body.searched_data;
    const searchType = req.body.searchType || 'semantic';
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const sort = req.body.sort || 'relevance';
    
    let query = client.graphql
      .get()
      .withClassName('Movies')
      .withFields(['title', 'genres', 'overview', 'popularity', 'runtime', 'tagline', 'cast', 'director', 'revenue', 'language', 'keywords'])
      .withLimit(limit)
      .withOffset((page - 1) * limit);
    

if (searchText && searchText.trim() !== '') {
    switch (searchType) {
      case 'keyword':
        query = query.withBm25({
          query: searchText,
          properties: ['title^3', 'overview', 'genres', 'cast', 'director', 'keywords'],
        });
        break;
        
      case 'semantic':
        query = query.withNearText({
          concepts: [searchText]
        });
        break;
        
      case 'hybrid':
        query = query.withHybrid({
          query: searchText,
          alpha: 0.5
        });
        break;
        
      default:
        query = query.withNearText({
          concepts: [searchText]
        });
    }
  }
    
    const filter = buildFilter(req.body);
    if (filter) {
      if (searchType !== 'semantic' || !searchText || searchText.trim() === '') {
        query = query.withWhere(filter);
      } else {
        query = query.withNearText({
          concepts: [searchText],
          certainty: 0.7,
          moveTo: {
            force: 0.2,
            concepts: ["movie"]
          }
        }).withWhere(filter);
      }
    }
    
    if (sort === 'popularity') {
      query = query.withSort({ path: ["popularity"], order: "desc" });
    } else if (sort === 'runtime') {
      query = query.withSort({ path: ["runtime"], order: "asc" });
    } else if (sort === 'revenue') {
      query = query.withSort({ path: ["revenue"], order: "desc" });
    }
    
    const info = await query.do();
    
    const countQuery = await client.graphql
      .aggregate()
      .withClassName('Movies')
      .withFields('meta { count }')
      .do();
    
    const totalCount = countQuery.data.Aggregate.Movies[0].meta.count;
    const totalPages = Math.ceil(totalCount / limit);
    
    res.render('search', {
      movie_info: info.data.Get.Movies,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        limit: limit
      },
      filters: req.body,
      searchText: searchText,
      searchType: searchType
    });
  } catch (err) {
    console.error('Error searching movies:', err);
    res.render('search', { 
      movie_info: [],
      error: 'An error occurred while searching for movies.',
      searchText: req.body.searched_data,
      searchType: req.body.searchType || 'semantic'
    });
  }
});

module.exports = router;