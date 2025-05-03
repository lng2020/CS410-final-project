const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const searchRoutes = require('./routes/search');
const moviesRoutes = require('./routes/movies');
const apiRoutes = require('./routes/api');

app.use('/search', searchRoutes);
app.use('/movies', moviesRoutes);
app.use('/api', apiRoutes);

app.get('/', (_, res) => {
  res.render('index', { 
    title: 'MovieLens - Movie Recommendation System'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});