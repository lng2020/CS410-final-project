# Movie Recommendation System

This is a **Weaviate-based Movie Recommendation System** that allows users to search for movies, view detailed information, and get personalized recommendations based on their search and viewing history. The application leverages semantic search and hybrid search techniques to provide accurate and meaningful results.

## Features

- **Search Movies**: Search for movies using keyword, semantic, or hybrid search.
- **View Movie Details**: Get detailed information about movies, including genres, cast, director, runtime, and more.
- **Personalized Recommendations**: Receive movie recommendations based on your search and viewing history.
- **Similar Movies**: Discover movies similar to the ones you like.
- **Responsive UI**: A user-friendly interface built with Bootstrap and EJS templates.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Bootstrap, Vanilla JavaScript
- **Database**: Weaviate (GraphQL-based vector search engine)
- **Other Libraries**:
  - `weaviate-client` for interacting with the Weaviate database.
  - `dotenv` for environment variable management.
  - `body-parser` for handling HTTP request bodies.
  - `ejs` for templating.
  - `xlsx` for handling Excel files.

## Installation

1. Clone the repository:
   ```bash
    git clone https://github.com/lng2020/CS410-final-project.git
    cd CS410-final-project
    ```
2. Install dependencies:
    ```bash
     npm install
     ```
3. Run Weaviate Instance via Docker:
    ```bash
    docker compose up -d
    ```
4. Set up environment variables in `.env` file:
    ```plaintext
    OPENAI_API_KEY: Your OpenAI API key
    ```
5. Import movie data into Weaviate:
    ```bash
    node run data:import
    ```
6. Start the server:
    ```bash
    npm start
    ```
7. Open your browser and navigate to `http://localhost:4000`.

## Project Structure

```
final-project/
├── public/                 # Static assets (CSS, JS, images)
│   ├── css/
│   ├── js/
├── routes/                 # Express route handlers
│   ├── api.js              # API routes for fetching data
│   ├── movies.js           # Routes for movie details
│   ├── search.js           # Routes for search functionality
├── scripts/                # Utility scripts (e.g., data import)
├── views/                  # EJS templates for rendering UI
│   ├── partials/           # Reusable components
│   ├── index.ejs           # Homepage
│   ├── search.ejs          # Search results page
│   ├── movie.ejs           # Movie details page
├── .env                    # Environment variables
├── [index.js](http://_vscodecontentref_/0)                # Main server file
├── [package.json](http://_vscodecontentref_/1)            # Project metadata and dependencies
```

## API Endpoints

### GET /search
Method: GET
Description: Fetches search results based on the query and search type.
Parameters:
### /movies/:id
Method: GET
Description: Fetches details of a specific movie by ID.
### /api/similar/:id
Method: GET
Description: Fetches similar movies based on the given movie ID.
### /api/recommendations
Method: POST
Description: Generates personalized recommendations based on user history.
