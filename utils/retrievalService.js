
const Document = require("../models/Document");
const { generateEmbedding } = require("./embeddingService");

// Calculate cosine similarity between two vectors
function cosineSimilarity(vectorA, vectorB) {
  if (
    !vectorA?.length ||
    !vectorB?.length ||
    vectorA.length !== vectorB.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] ** 2;
    magnitudeB += vectorB[i] ** 2;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// Find the most relevant chunks for a question
async function retrieveRelevantChunks(question, documentId, limit = 4) {
  const queryEmbedding = await generateEmbedding(
    question,
    "search_query"
  );

  const filter = documentId ? { _id: documentId } : {};

  const documents = await Document.find(filter).select("filename chunks");

  const results = [];

  for (const document of documents) {
    for (const chunk of document.chunks) {
      if (!chunk.embedding || chunk.embedding.length !== queryEmbedding.length) {
        continue;
      }

      results.push({
        filename: document.filename,
        documentId: document._id,
        chunkIndex: chunk.index,
        text: chunk.text,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

module.exports = {
  cosineSimilarity,
  retrieveRelevantChunks,
};
