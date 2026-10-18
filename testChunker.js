const chunkText = require("./utils/textChunker");

const sampleText = `
Retrieval Augmented Generation (RAG) helps AI
answer questions using external documents.
Embeddings represent text as numerical vectors.
Vector databases store and search these vectors.
`;

const chunks = chunkText(sampleText, 50, 10);

console.log("Total chunks:", chunks.length);
console.log(chunks);
