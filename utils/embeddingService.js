
const { CohereClientV2 } = require("cohere-ai");

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

async function generateEmbedding(text, inputType = "search_document") {
  if (!text || typeof text !== "string") {
    throw new Error("Text is required to generate an embedding.");
  }

  const response = await cohere.embed({
    model: "embed-english-v3.0",
    texts: [text],
    inputType,
    embeddingTypes: ["float"],
  });

  const vector = response.embeddings.float[0];

  if (!vector || vector.length === 0) {
    throw new Error("Cohere returned an empty embedding.");
  }

  return vector;
}

module.exports = { generateEmbedding };
