
const path = require("path");

// Load environment variables BEFORE importing services
require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");

const {
    ai,
    groq,
    hf,
    askGemini,
    askGroq,
    askHuggingFace,
} = require("./aiService");

const {
    tvly,
    searchWeb,
    validateCitationUrls,
} = require("./researchUtils");

const { verifyClaim } = require("./verificationService");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            "http://localhost:3000",
    })
);

app.use(express.json({ limit: "20kb" }));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ResearchPilot backend is running",
        services: {
            gemini: Boolean(ai),
            groq: Boolean(groq),
            huggingface: Boolean(hf),
            tavily: Boolean(tvly),
        },
    });
});

// Available AI models
app.get("/api/models", (req, res) => {
    res.status(200).json({
        success: true,
        models: [
            {
                provider: "Gemini",
                model: "gemini-flash-lite-latest",
                configured: Boolean(ai),
            },
            {
                provider: "Groq",
                model: "llama-3.3-70b-versatile",
                configured: Boolean(groq),
            },
            {
                provider: "Hugging Face",
                model: "Qwen/Qwen2.5-7B-Instruct:fastest",
                configured: Boolean(hf),
            },
        ],
    });
});

// Main research endpoint
app.post("/api/research", async (req, res) => {
    try {
        const { question } = req.body || {};

        // Validate question
        if (
            typeof question !== "string" ||
            !question.trim()
        ) {
            return res.status(400).json({
                success: false,
                error: "Please enter a research question.",
            });
        }

        const cleanQuestion = question.trim();

        if (cleanQuestion.length > 2000) {
            return res.status(400).json({
                success: false,
                error:
                    "Question must be 2000 characters or fewer.",
            });
        }

        // Check AI provider configuration
        if (!ai && !groq && !hf) {
            return res.status(503).json({
                success: false,
                error:
                    "No AI provider is configured. Check your backend .env file.",
            });
        }

        // Search the web using Tavily
        let sources = [];

        if (tvly) {
            try {
                sources = await searchWeb(cleanQuestion);
            } catch (error) {
                console.error(
                    "Tavily search failed:",
                    error.message
                );
            }
        }

        // Try providers in order: Gemini -> Groq -> Hugging Face
        let answer;
        let provider;

        if (ai) {
            try {
                answer = await askGemini(
                    cleanQuestion,
                    sources
                );

                if (answer) {
                    provider = "gemini";
                }
            } catch (error) {
                console.error(
                    "Gemini request failed:",
                    error.message
                );
            }
        }

        if (!answer && groq) {
            try {
                answer = await askGroq(
                    cleanQuestion,
                    sources
                );

                if (answer) {
                    provider = "groq";
                }
            } catch (error) {
                console.error(
                    "Groq request failed:",
                    error.message
                );
            }
        }

        if (!answer && hf) {
            try {
                answer = await askHuggingFace(
                    cleanQuestion,
                    sources
                );

                if (answer) {
                    provider = "huggingface";
                }
            } catch (error) {
                console.error(
                    "Hugging Face request failed:",
                    error.message
                );
            }
        }

        // Return an error if all AI providers fail
        if (!answer) {
            return res.status(503).json({
                success: false,
                error:
                    "The AI providers could not generate an answer. Please try again later.",
            });
        }

        // Allow citation links only when their URLs match search results
      const validatedAnswer = validateCitationUrls(answer, sources);

        // Extract a small number of report claims for the MVP
        const claimCandidates = validatedAnswer
            .replace(/^#{1,6}\s.*$/gm, "")
            .split(/(?<=[.!?])\s+/)
            .map((sentence) =>
                sentence
                    .replace(
                        /\[([^\]]+)\]\(https?:\/\/[^)]+\)/g,
                        "$1"
                    )
                    .trim()
            )
            .filter(
                (sentence) =>
                    sentence.length > 40 &&
                    !sentence.startsWith("```")
            )
            .slice(0, 5);

        // Verify claims without failing the whole research request
        const claimChecks = [];

        for (const claim of claimCandidates) {
            try {
                const result = await verifyClaim(
                    claim,
                    sources
                );

                claimChecks.push(result);
            } catch (error) {
                console.error(
                    "Claim check failed:",
                    error.message
                );

                claimChecks.push({
                    claim,
                    status: "insufficient_evidence",
                    explanation:
                        "Verification could not be completed.",
                    sourceUrls: [],
                });
            }
        }

        // Return the completed research response
        return res.status(200).json({
            success: true,
            answer: validatedAnswer,
            provider,
            sources,
            claimChecks,
        });
    } catch (error) {
        console.error(
            "Research endpoint error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error:
                "An unexpected server error occurred.",
        });
    }
});

// Verify a factual claim against supplied source content
app.post("/api/verify-claim", async (req, res) => {
    try {
        const { claim, sources } = req.body || {};

        // Validate claim
        if (
            typeof claim !== "string" ||
            !claim.trim()
        ) {
            return res.status(400).json({
                success: false,
                error: "Please provide a claim to verify.",
            });
        }

        if (claim.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                error:
                    "Claim must be 2000 characters or fewer.",
            });
        }

        // Validate sources
        if (
            sources !== undefined &&
            !Array.isArray(sources)
        ) {
            return res.status(400).json({
                success: false,
                error: "Sources must be an array.",
            });
        }

        // Verify the claim
        const result = await verifyClaim(
            claim.trim(),
            sources || []
        );

        return res.status(200).json({
            success: true,
            verification: result,
        });
    } catch (error) {
        console.error(
            "Verification error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error: "Claim verification failed.",
        });
    }
});

// Handle invalid JSON bodies
app.use((error, req, res, next) => {
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            success: false,
            error: "Invalid JSON request body.",
        });
    }

    next(error);
});

// Start server
app.listen(PORT, () => {
    console.log(
        `ResearchPilot backend running at http://localhost:${PORT}`
    );

    console.log("Configured services:", {
        gemini: Boolean(ai),
        groq: Boolean(groq),
        huggingface: Boolean(hf),
        tavily: Boolean(tvly),
    });
});
