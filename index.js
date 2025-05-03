const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const weaviate = require("weaviate-client");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

const searchRoutes = require('./routes/search');
const moviesRoutes = require('./routes/movies');
const apiRoutes = require('./routes/api');

app.use('/search', searchRoutes);
app.use('/movies', moviesRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.render('index', { 
    title: 'MovieLens - Movie Recommendation System'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});