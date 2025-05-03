const weaviate = require("weaviate-client");
const XLSX = require('xlsx');
require('dotenv').config();

const openaiKey = process.env.OPENAI_API_KEY || "";

const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080",
  headers: {
    "X-OpenAI-Api-Key": openaiKey
  }
});

const collectionName = "Movies";

async function resetSchema() {
  try {
    const schema = await client.schema.getter().do();
    const exists = schema.classes.some(c => c.class === collectionName);
    
    if (exists) {
      await client.schema.classDeleter().withClassName(collectionName).do();
      console.log(`Existing ${collectionName} class deleted.`);
    }
  } catch (err) {
    console.error(`Error checking/deleting ${collectionName} class:`, err.message);
  }

  const classObj = {
    class: collectionName,
    description: "Various Info about movies",
    vectorizer: "text2vec-openai",
    vectorIndexConfig: {
      distance: "cosine",
    },
    moduleConfig: {
      "text2vec-openai": {
        vectorizeClassName: false,
        model: "ada",
        modelVersion: "002",
        type: "text"
      },
    },
    properties: [
      {
        name: "movie_id",
        dataType: ["number"],
        description: "Unique identifier for the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "title",
        dataType: ["text"],
        description: "The name of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "genres",
        dataType: ["text"],
        description: "The genres of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "overview",
        dataType: ["text"],
        description: "Overview of the movie",
      },
      {
        name: "keywords",
        dataType: ["text"],
        description: "Main keywords of the movie",
      },
      {
        name: "popularity",
        dataType: ["number"],
        description: "Popularity of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "runtime",
        dataType: ["number"],
        description: "Runtime of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "cast",
        dataType: ["text"],
        description: "The cast of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "language",
        dataType: ["text"],
        description: "Language in which the movie was made",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "tagline",
        dataType: ["text"],
        description: "Tagline of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "revenue",
        dataType: ["number"],
        description: "Revenue of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: "director",
        dataType: ["text"],
        description: "Director of the movie",
        moduleConfig: {
          "text2vec-openai": {  
            skip: true,
            vectorizePropertyName: false
          }
        }
      }
    ]
  };

  try {
    await client.schema.classCreator().withClass(classObj).do();
    console.log("Schema created successfully");
  } catch (err) {
    console.error("Error creating schema:", err);
  }
}

async function importData() {
  try {
    const workbook = XLSX.readFile("./data/movies.xlsx");
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Processing ${data.length} movies...`);

    const batchSize = 100;
    let batchCount = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const objects = batch.map(movie => {
        return {
          class: collectionName,
          properties: {
            movie_id: parseFloat(movie["id"]),
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
          },
        };
      });

      try {
        await client.batch
          .objectsBatcher()
          .withObjects(objects)
          .do();
        console.log(`Batch ${++batchCount} processed successfully`);
      }
      catch (err) {
        console.error("Error processing batch:", err);
      }
    }
        
    const count = await client.graphql
      .aggregate()
      .withClassName(collectionName)
      .withFields('meta { count }')
      .do();
      
    console.log(`Total movies imported: ${count.data.Aggregate[collectionName][0].meta.count}`);
    
  } catch (err) {
    console.error("Error importing data:", err);
  }
}

async function main() {
  await resetSchema();
  await importData();
}

main().catch((err) => console.error("Error in main:", err));