
const {
    ai,
    groq,
    hf,
    askGemini,
    askGroq,
    askHuggingFace,
} = require("../aiService");

const {
    tvly,
    searchWeb,
    validateCitationUrls,
    rankSourcesByRelevance,
} = require("../utils/researchUtils");

const { verifyClaim } = require("./verificationService");

async function runResearch(question) {
    if (!ai && !groq && !hf) {
        const error = new Error(
            "No AI provider is configured."
        );
        error.status = 503;
        throw error;
    }

    const claim = question
        .replace(
            /^(please\s+)?(verify|fact-check|check)\s+(the\s+claim\s+that\s+)?/i,
            ""
        )
        .replace(/[?]+$/, "")
        .trim();

    let sources = [];

    if (tvly) {
        try {
            const results = await Promise.all([
                searchWeb(question),
                searchWeb(`${claim} official source history facts`),
            ]);

            const uniqueSources = new Map();

            for (const source of results.flat()) {
                if (
                    source.url &&
                    source.content &&
                    !uniqueSources.has(source.url)
                ) {
                    uniqueSources.set(source.url, source);
                }
            }

            sources = [...uniqueSources.values()];
        } catch (error) {
            console.error("Tavily search failed:", error.message);
        }
    }

    let answer;
    let provider;

    const providers = [
        ["gemini", ai, askGemini],
        ["groq", groq, askGroq],
        ["huggingface", hf, askHuggingFace],
    ];

    for (const [name, configured, ask] of providers) {
        if (!configured) continue;

        try {
            answer = await ask(question, sources);

            if (answer) {
                provider = name;
                break;
            }
        } catch (error) {
            console.error(`${name} failed:`, error.message);
        }
    }

    if (!answer) {
        const error = new Error(
            "The AI providers could not generate an answer. Please try again later."
        );
        error.status = 503;
        throw error;
    }

    const validatedAnswer = validateCitationUrls(
        answer,
        sources
    );

    let claimChecks = [];

    if (claim) {
        try {
            const relevantSources =
                rankSourcesByRelevance(claim, sources).slice(0, 5);

            const result = await verifyClaim(
                claim,
                relevantSources
            );

            claimChecks.push(result);
        } catch (error) {
            console.error("Claim check failed:", error.message);

            claimChecks.push({
                claim,
                status: "insufficient_evidence",
                explanation:
                    "Verification could not be completed using the available sources.",
                sourceUrls: [],
            });
        }
    }

    return {
        answer: validatedAnswer,
        provider,
        sources,
        claimChecks,
    };
}

module.exports = { runResearch };
