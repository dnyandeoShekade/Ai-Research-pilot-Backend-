
const { searchWeb } = require("../researchUtils");


async function webSearchTool({ query }) {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("A search query is required.");
  }

  // Reuse your existing Tavily integration.
  const results = await searchWeb(query.trim());

  // Return only the fields the agent needs.
  return (results || []).slice(0, 5).map((source) => ({
    title: source.title || "Untitled source",
    url: source.url,
    content: source.content || "",
  }));
}

module.exports = { webSearchTool };