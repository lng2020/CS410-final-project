const pd = require("node-pandas");
const weaviate = require("weaviate-client");

const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080",
});

async function resetSchema() {
  try {
    await client.schema.classDeleter().withClassName("Movies").do();
    console.log("Existing Movies class deleted.");
  } catch (err) {
    console.error("Error deleting Movies class (if it exists):", err.message);
  }

  const classObj = {
    class: "Movies",
    description: "Various Info about movies",
    properties: [
      {
        name: "id",
        dataType: ["string"],
        description: "Unique identifier for the movie",
      },
      {
        name: "title",
        dataType: ["string"],
        description: "The name of the movie",
      },
      {
        name: "genres",
        dataType: ["string"],
        description: "The genres of the movie",
      },
      {
        name: "overview",
        dataType: ["string"],
        description: "Overview of the movie",
      },
      {
        name: "keywords",
        dataType: ["string"],
        description: "Main keywords of the movie",
      },
      {
        name: "popularity",
        dataType: ["number"],
        description: "Popularity of the movie",
      },
      {
        name: "runtime",
        dataType: ["number"],
        description: "Runtime of the movie",
      },
      {
        name: "cast",
        dataType: ["string"],
        description: "The cast of the movie",
      },
      {
        name: "language",
        dataType: ["string"],
        description: "Language in which the movie was made",
      },
      {
        name: "tagline",
        dataType: ["string"],
        description: "Tagline of the movie",
      },
      {
        name: "revenue",
        dataType: ["number"],
        description: "Revenue of the movie",
      },
      {
        name: "director",
        dataType: ["string"],
        description: "Director of the movie",
      },
    ],
  };

  await client.schema
    .classCreator()
    .withClass(classObj)
    .do()
    .then((res) => {
      console.log("Schema created:", res);
    })
    .catch((err) => {
      console.error("Error creating schema:", err);
    });
}

async function importData() {
  const data = pd.readCsv("./data/movies.csv");

  data.forEach(function (movie) {
    try {
      const movie_object = {
        movie_id: movie["id"],
        title: movie["original_title"],
        genres: movie["genres"],
        overview: movie["overview"],
        keywords: movie["keywords"],
        popularity: parseFloat(movie["popularity"]),
        runtime: parseInt(movie["runtime"]),
        cast: movie["cast"],
        language: movie["original_language"],
        tagline: movie["tagline"],
        revenue: parseInt(movie["revenue"]),
        director: movie["director"],
      };

      client.data
        .creator()
        .withClassName("Movies")
        .withProperties(movie_object)
        .do()
        .then((res) => {
          console.log("Movie added:", res);
        })
        .catch((err) => {
          console.error("Error adding movie:", err);
        });
    } catch (e) {
      console.error("Error processing movie:", e);
    }
  });
}

async function main() {
  await resetSchema();
  await importData();
}

main().catch((err) => console.error("Error in main:", err));