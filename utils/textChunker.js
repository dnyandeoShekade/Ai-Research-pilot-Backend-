
// // function chunkText(text, chunkSize = 1000, overlap = 200) {
// //   if (!text || typeof text !== "string") {
// //     return [];
// //   }

// //   if (overlap < 0 || overlap >= chunkSize) {
// //     throw new Error("Overlap must be smaller than chunk size");
// //   }

// //   const cleanText = text.replace(/\s+/g, " ").trim();

// //   if (!cleanText) {
// //     return [];
// //   }

// //   const chunks = [];
// //   let start = 0;

// //   while (start < cleanText.length) {
// //     const end = Math.min(start + chunkSize, cleanText.length);

// //     chunks.push({
// //       index: chunks.length,
// //       text: cleanText.slice(start, end),
// //     });

// //     if (end === cleanText.length) break;

// //     start = end - overlap;
// //   }

// //   return chunks;
// // }

// // module.exports = chunkText;

// function chunkText(text, chunkSize = 1000, overlap = 200) {
//   if (!text || typeof text !== "string") return [];

//   if (overlap < 0 || overlap >= chunkSize) {
//     throw new Error("Overlap must be smaller than chunk size");
//   }

//   const chunks = [];
//   const pagePattern = /([\s\S]*?)--\s*(\d+)\s+of\s+\d+\s*--/g;

//   let match;

//   function addPageChunks(pageText, pageNumber) {
//     const cleanText = pageText.replace(/\s+/g, " ").trim();
//     if (!cleanText) return;

//     let start = 0;

//     while (start < cleanText.length) {
//       const end = Math.min(start + chunkSize, cleanText.length);

//       chunks.push({
//         index: chunks.length,
//         pageNumber,
//         text: cleanText.slice(start, end),
//       });

//       if (end === cleanText.length) break;
//       start = end - overlap;
//     }
//   }

//   while ((match = pagePattern.exec(text)) !== null) {
//     addPageChunks(match[1], Number(match[2]));
//   }

//   // Fallback if the extracted text has no page markers
//   if (chunks.length === 0) {
//     addPageChunks(text, 1);
//   }

//   return chunks;
// }

// module.exports = chunkText;

function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || typeof text !== "string") return [];

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("Overlap must be smaller than chunk size");
  }

  const chunks = [];

  // Find the page markers added by pdf-parse
  const pagePattern = /([\s\S]*?)--\s*(\d+)\s+of\s+\d+\s*--/g;

  let match;
  let lastIndex = 0;

  function addPageChunks(pageText, pageNumber) {
    const cleanText = pageText.replace(/\s+/g, " ").trim();

    if (!cleanText) return;

    let start = 0;

    while (start < cleanText.length) {
      const end = Math.min(start + chunkSize, cleanText.length);

      chunks.push({
        index: chunks.length,
        pageNumber,
        text: cleanText.slice(start, end),
      });

      if (end === cleanText.length) break;

      start = end - overlap;
    }
  }

  while ((match = pagePattern.exec(text)) !== null) {
    addPageChunks(match[1], Number(match[2]));
    lastIndex = pagePattern.lastIndex;
  }

  // Handle any text remaining after the last marker
  const remainingText = text.slice(lastIndex).trim();

  if (remainingText) {
    const lastPageMatch = text.match(/--\s*(\d+)\s+of\s+\d+\s*--\s*$/);
    const lastPageNumber = lastPageMatch
      ? Number(lastPageMatch[1])
      : 1;

    addPageChunks(remainingText, lastPageNumber);
  }

  // Fallback for text without page markers
  if (chunks.length === 0) {
    const cleanText = text.replace(/\s+/g, " ").trim();
    let start = 0;

    while (start < cleanText.length) {
      const end = Math.min(start + chunkSize, cleanText.length);

      chunks.push({
        index: chunks.length,
        pageNumber: 1,
        text: cleanText.slice(start, end),
      });

      if (end === cleanText.length) break;

      start = end - overlap;
    }
  }

  return chunks;
}

module.exports = chunkText;
