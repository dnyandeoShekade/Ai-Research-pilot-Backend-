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
            score:
                typeof item.score === "number"
                    ? item.score
                    : null,
        }));
}

// Clean common escaped Markdown characters.

function cleanResearchAnswer(text) {
  if (typeof text !== "string") {
    return "";
  }

  return text
    // Remove escaping added before Markdown characters
    .replace(/\\([#*_[\]()])/g, "$1")
    .replace(/\\:/g, ":")
    .replace(/\\\./g, ".")
    .replace(/\\-/g, "-")
    .replace(/\\!/g, "!")
    .trim();
}


// Normalize a URL for comparison.
function normalizeUrl(value) {
    try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }

        // Ignore fragments, but preserve path and query.
        url.hash = "";

        return url.href;
    } catch {
        return null;
    }
}

// Keep citations only when their URLs came from search results.
// This checks URL provenance, NOT whether the source proves the claim.
function validateCitationUrls(answer, sources = []) {
    if (typeof answer !== "string") {
        return "";
    }

    const allowedUrls = new Set(
        sources
            .filter(
                (source) =>
                    source &&
                    typeof source.url === "string"
            )
            .map((source) => normalizeUrl(source.url))
            .filter(Boolean)
    );

    // Repair common malformed citation formats, such as:
    // [- [Title](URL)]
    // [Title]\(URL\)
    let repairedAnswer = answer
        .replace(
            /\[\s*-\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\s*\]/g,
            "[$1]($2)"
        )
        .replace(
            /\[([^\]]+)\]\\\((https?:\/\/[^)\s]+)\\\)/g,
            "[$1]($2)"
        );

    // Validate standard Markdown links.
    const markdownLinkPattern =
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

    repairedAnswer = repairedAnswer.replace(
        markdownLinkPattern,
        (match, title, url) => {
            const normalizedUrl = normalizeUrl(url);

            if (
                !normalizedUrl ||
                !allowedUrls.has(normalizedUrl)
            ) {
                return `${title} (unverified link)`;
            }

            return `[${title}](${url})`;
        }
    );

    return repairedAnswer;
}
// Score sources by keyword relevance to a claim
function rankSourcesByRelevance(claim, sources = []) {
    const stopWords = new Set([
        "the", "is", "was", "are", "were", "a", "an",
        "of", "in", "on", "at", "to", "for", "by",
        "and", "or", "that", "this", "with", "from",
        "it", "be", "as", "created", "invented",
    ]);

    const keywords = claim
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(
            (word) =>
                word.length > 2 && !stopWords.has(word)
        );

    return sources
        .map((source) => {
            const title = (source.title || "").toLowerCase();
            const content = (source.content || "").toLowerCase();

            let score = 0;

            for (const word of keywords) {
                if (title.includes(word)) score += 3;
                if (content.includes(word)) score += 1;
            }

            return { ...source, relevanceScore: score };
        })
        .filter((source) => source.relevanceScore > 0)
        .sort(
            (a, b) => b.relevanceScore - a.relevanceScore
        );
}

module.exports = {
    tvly,
    searchWeb,
    cleanResearchAnswer,
    validateCitationUrls,
    rankSourcesByRelevance,
};