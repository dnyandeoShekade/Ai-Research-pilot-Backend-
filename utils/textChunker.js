
function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || typeof text !== "string") {
    return [];
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("Overlap must be smaller than chunk size");
  }

  const cleanText = text.replace(/\s+/g, " ").trim();

  if (!cleanText) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);

    chunks.push({
      index: chunks.length,
      text: cleanText.slice(start, end),
    });

    if (end === cleanText.length) break;

    start = end - overlap;
  }

  return chunks;
}

module.exports = chunkText;
