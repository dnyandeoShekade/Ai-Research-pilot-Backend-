
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

// Find relevant chunks inside the selected PDF
async function retrieveRelevantChunks(question, documentId, limit = 4) {
  if (!documentId) {
    throw new Error("Please upload and select a PDF first.");
  }

  const queryEmbedding = await generateEmbedding(
    question,
    "search_query"
  );

  // Search only inside the selected PDF
  const document = await Document.findById(documentId)
    .select("filename chunks");

  if (!document) {
    throw new Error("Selected PDF was not found.");
  }

  const results = [];

  for (const chunk of document.chunks) {
    if (
      !chunk.embedding ||
      chunk.embedding.length !== queryEmbedding.length
    ) {
      continue;
    }

    results.push({
      filename: document.filename,
      documentId: document._id.toString(),
      chunkIndex: chunk.index,
      pageNumber: chunk.pageNumber || 1,
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    });
  }

  results.sort((a, b) => b.score - a.score);

  const MIN_SIMILARITY = Number(
    process.env.RAG_MIN_SIMILARITY ?? 0.40
  );

  const relevantResults = results.filter(
    (chunk) => chunk.score >= MIN_SIMILARITY
  );

  console.log("RAG threshold:", MIN_SIMILARITY);
  console.log(
    "Top scores:",
    results.slice(0, limit).map((chunk) => chunk.score)
  );
  console.log("Chunks after filtering:", relevantResults.length);

  return relevantResults.slice(0, limit);
}

module.exports = {
  cosineSimilarity,
  retrieveRelevantChunks,
};
