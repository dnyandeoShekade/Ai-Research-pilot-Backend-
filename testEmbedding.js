
require("dotenv").config();

const { generateEmbedding } = require("./utils/embeddingService");

async function test() {
  try {
    console.log("Testing Cohere embedding...");
    console.log("API key loaded:", Boolean(process.env.COHERE_API_KEY));

    const vector = await generateEmbedding(
      "ResearchPilot helps users research documents."
    );

    console.log("Embedding generated successfully!");
    console.log("Vector dimensions:", vector.length);
    console.log("First 5 values:", vector.slice(0, 5));
  } catch (error) {
    console.error("Embedding test failed:");
    console.error(error.message || error);
  }
}

test();
