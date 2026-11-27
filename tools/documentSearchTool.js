const { retrieveRelevantChunks } = require("../utils/retrievalService");
const Document = require("../models/Document");

/**
 * Tool for semantic search inside uploaded PDF research papers.
 * Allows the AI agent to query the vector-embedded document corpus.
 */
async function documentSearchTool({ query, documentId, limit = 4 }) {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("A search query is required for document search.");
  }

  let targetDocId = documentId;

  // If no documentId was explicitly passed, look up the most recent document
  if (!targetDocId) {
    const latestDoc = await Document.findOne().sort({ createdAt: -1 }).select("_id filename");
    if (!latestDoc) {
      return {
        found: false,
        message: "No documents have been uploaded yet. Please upload a research PDF first.",
        results: [],
      };
    }
    targetDocId = latestDoc._id.toString();
  }

  const chunks = await retrieveRelevantChunks(query.trim(), targetDocId, limit);

  if (!chunks || chunks.length === 0) {
    return {
      found: false,
      documentId: targetDocId,
      message: `No chunks matching "${query}" were found with sufficient similarity in the document.`,
      results: [],
    };
  }

  return {
    found: true,
    documentId: targetDocId,
    filename: chunks[0].filename,
    results: chunks.map((c) => ({
      pageNumber: c.pageNumber,
      chunkIndex: c.chunkIndex,
      similarityScore: Number(c.score.toFixed(4)),
      textExcerpt: c.text,
    })),
  };
}

module.exports = { documentSearchTool };
