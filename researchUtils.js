
const { tavily } = require("@tavily/core");

const tvly = process.env.TAVILY_API_KEY
  ? tavily({ apiKey: process.env.TAVILY_API_KEY })
  : null;

// Search the web and keep useful source metadata.
async function searchWeb(question) {
  if (!tvly) {
    throw new Error("Tavily API key is not configured.");
  }

  const result = await tvly.search(question, {
    searchDepth: "advanced",
    maxResults: 5,
  });

  return (result.results || [])
    .filter(
      (item) =>
        typeof item.url === "string" &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
    )
    .map((item) => ({
      title: item.title || "Untitled source",
      url: item.url,
      content: item.content.trim(),
      score: typeof item.score === "number" ? item.score : null,
    }));
}

// Clean common escaped Markdown characters.
function cleanResearchAnswer(text) {
  if (typeof text !== "string") return "";

  return text
    .replace(/\\([#*_[\]()])/g, "$1")
    .replace(/\\:/g, ":")
    .replace(/\\\./g, ".")
    .replace(/\\-/g, "-")
    .trim();
}

// Normalize a URL for comparison.
function normalizeUrl(value) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    // Ignore fragments, but preserve the path and query.
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

// Keep citations only when their URLs came from search results.
// This checks URL provenance, NOT whether the source proves the claim.
function validateCitationUrls(answer, sources = []) {
  const allowedUrls = new Set(
    sources
      .map((source) => normalizeUrl(source.url))
      .filter(Boolean)
  );

  // Repair the common malformed format: [- [Title](URL)]
  const repairedAnswer = answer.replace(
    /\[\s*-\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\s*\]/g,
    "[$1]($2)"
  );

  const markdownLinkPattern =
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

  return repairedAnswer.replace(
    markdownLinkPattern,
    (match, title, url) => {
      const normalizedUrl = normalizeUrl(url);

      if (!normalizedUrl || !allowedUrls.has(normalizedUrl)) {
        return `${title} (unverified link)`;
      }

      return `[${title}](${url})`;
    }
  );
}

module.exports = {
  tvly,
  searchWeb,
  cleanResearchAnswer,
  validateCitationUrls,
};
