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
  if (typeof text !== "string") return "";

  return text
    // Unescape Markdown punctuation
    .replace(/\\([\\`*_{}\[\]()#+\-.!|>~<>])/g, "$1")
    // Fix escaped slashes and URL protocols
    .replace(/\\\//g, "/")
    .replace(/\\(?=https?:)/gi, "")
    // Remove whitespace before line breaks
    .replace(/[ \t]+\n/g, "\n")
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
    const allowedUrls = new Map();

    for (const source of sources) {
        const normalized = normalizeUrl(source.url);

        if (normalized) {
            allowedUrls.set(normalized, {
                title: source.title || "Verified source",
                url: normalized,
            });
        }
    }

    let result = cleanResearchAnswer(answer);

    // Keep Markdown links only when their URLs came from Tavily.
    result = result.replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        (match, title, url) => {
            const normalized = normalizeUrl(
                url.replace(/&amp;/g, "&")
            );

            if (!normalized || !allowedUrls.has(normalized)) {
                return title;
            }

            return `[${title}](${normalized})`;
        }
    );

    // Convert plain-text citation labels into links when their
    // titles match a source returned by Tavily.
    for (const source of allowedUrls.values()) {
        const title = source.title
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const citationPattern = new RegExp(
            `\\[([^\\]]+)\\]\\(\\s*${title}\\s*\\)`,
            "gi"
        );

        result = result.replace(
            citationPattern,
            `[${source.title}](${source.url})`
        );
    }

    // Remove raw URLs that did not come from Tavily.
    result = result.replace(
        /https?:\/\/[^\s<>)\]]+/g,
        (url) => {
            const trailing = url.match(/[.,;]+$/)?.[0] || "";
            const candidate = url.slice(
                0,
                url.length - trailing.length
            );

            const normalized = normalizeUrl(candidate);

            return normalized && allowedUrls.has(normalized)
                ? candidate + trailing
                : trailing;
        }
    );

    return result;
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

function buildVerifiedSources(sources = []) {
    const seen = new Set();

    const verifiedSources = sources.filter((source) => {
        const url = normalizeUrl(source.url);

        if (!url || seen.has(url)) {
            return false;
        }

        seen.add(url);
        return true;
    });

    if (verifiedSources.length === 0) {
        return "";
    }

    const sourceLines = verifiedSources.map((source) => {
        const title = (source.title || "Untitled source")
            .replace(/[\[\]\r\n]/g, "")
            .trim();

        const url = normalizeUrl(source.url);

        return `- [${title || "Untitled source"}](${url})`;
    });

    return `### Sources\n${sourceLines.join("\n")}`;
}


const test = String.raw`\*\*The Technique:\*\* Use \`useMemo\` and \(https\://example.com\)`;

console.log("CLEANER TEST:", cleanResearchAnswer(test));

module.exports = {
    tvly,
    searchWeb,
    cleanResearchAnswer,
    validateCitationUrls,
    rankSourcesByRelevance,
    buildVerifiedSources,
};