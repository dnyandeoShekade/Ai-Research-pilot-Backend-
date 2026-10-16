models/gemini-2.5-flash
models/gemini-2.5-pro
models/gemini-2.5-flash-preview-tts
models/gemini-2.5-pro-preview-tts  
models/gemma-4-26b-a4b-it
models/gemma-4-31b-it
models/gemini-flash-latest
models/gemini-flash-lite-latest
models/gemini-pro-latest
models/gemini-2.5-flash-lite
models/gemini-2.5-flash-image
models/gemini-3-flash-preview
models/gemini-3.1-pro-preview
models/gemini-3.1-pro-preview-customtools
models/gemini-3.1-flash-lite-preview
models/gemini-3.1-flash-lite
models/gemini-3-pro-image-preview
models/gemini-3-pro-image
models/nano-banana-pro-preview
models/gemini-3.1-flash-image-preview
models/gemini-3.1-flash-image
models/gemini-3.1-flash-lite-image
models/gemini-nano-banana-2.1
models/gemini-3.5-flash
models/gemini-3.5-flash-lite
models/gemini-omni-flash-preview
models/gemini-omni-1.1-flash
models/gemini-3.5-transcribe
models/gemini-3.6-flash
models/gemini-3.7-flash
models/gemini-3.8-flash
models/gemini-4-argon
models/lyria-3-clip-preview
models/lyria-3-pro-preview
models/lyria-3.5
models/gemini-3.1-flash-tts-preview
models/gemini-3.8-flash-tts
models/gemini-3.8-flash-lite-tts
models/gemini-robotics-er-2-preview
models/gemini-2.5-computer-use-preview-10-2025
models/antigravity-preview-05-2026
models/antigravity-preview-09-2026
models/antigravity-preview-latest
models/deep-research-max-preview-04-2026
models/deep-research-preview-04-2026
models/deep-research-pro-preview-12-2025
PS D:\coding project\placement project\researchpilot\backend> ^C
PS D:\coding project\placement project\researchpilot\backend> 






// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();
// const Groq = require("groq-sdk");
// const { tavily } = require("@tavily/core");

// const { GoogleGenAI } = require("@google/genai");

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors({ origin: "http://localhost:3000" }));
// app.use(express.json({ limit: "20kb" }));

// // Initialize Gemini securely on the backend
// const ai = process.env.GEMINI_API_KEY
//     ? new GoogleGenAI({
//         apiKey: process.env.GEMINI_API_KEY,
//     })
//     : null;

// const groq = process.env.GROQ_API_KEY
//     ? new Groq({
//         apiKey: process.env.GROQ_API_KEY,
//     })
//     : null;

// const tvly = process.env.TAVILY_API_KEY
//     ? tavily({ apiKey: process.env.TAVILY_API_KEY })
//     : null;
// // Health check
// app.get("/api/health", (req, res) => {
//     res.json({
//         success: true,
//         message: "ResearchPilot backend is running!",
//     });
// });

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// function isTemporaryError(error) {
//     const status = error.status || error.statusCode;

//     return (
//         [408, 429, 500, 502, 503, 504].includes(status) ||
//         ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(error.code)
//     );
// }

// async function askGemini(question, sources = []) {
//     let lastError;

//     function cleanResearchAnswer(text) {
//         return text
//             .replace(/\\([#*_[\]()])/g, "$1")
//             .replace(/\\:/g, ":")
//             .replace(/\\\./g, ".")
//             .replace(/\\-/g, "-")
//             .trim();
//     }

//     // Two attempts total for temporary errors
//     for (let attempt = 0; attempt < 2; attempt++) {
//         try {
//             const response = await ai.models.generateContent({
//                 model: "gemini-flash-lite-latest",


//                 contents: `You are ResearchPilot, a reliable AI research assistant.

// Research question:
// ${question}

// Web search results:
// ${JSON.stringify(sources)}

// Write your report using these headings:
// ## 1. Executive Summary
// ## 2. Key Findings
// ## 3. Advantages and Disadvantages
// ## 4. Real-World Examples
// ## 5. Conclusion

// Research and citation rules:
// Citation rules:
// - Cite each important factual claim using a normal Markdown link.
// - Use only URLs provided in the supplied web search results.
// - Never place multiple Markdown links inside an extra pair of square brackets.
// - Do not invent, modify, or reconstruct URLs.
// - Match each claim to the most relevant source content.
// - Do not use a source if its supplied content does not support the claim.
// - If a statistic cannot be verified from the supplied source content, omit it or explicitly label it unverified.
// - Clearly distinguish sourced facts from your own analysis.
// - If the available evidence is insufficient, say so.

// Important:
// The presence of a URL does not automatically prove a claim.
// If the search results do not provide enough evidence, explicitly say so.`,


//             });

//             if (!response.text?.trim()) {
//                 throw new Error("Gemini returned an empty answer");
//             }

//             return cleanResearchAnswer(response.text);
//         } catch (error) {
//             lastError = error;

//             if (!isTemporaryError(error) || attempt === 1) {
//                 throw error;
//             }

//             console.warn("Gemini temporary error; retrying once...");
//             await sleep(1000);
//         }
//     }

//     throw lastError;
// }


// async function askGroq(question, sources = []) {
//     const completion = await groq.chat.completions.create({
//         model: "llama-3.3-70b-versatile",
//         messages: [
//             {
//                 role: "system",

//                 contents: `You are ResearchPilot, a reliable AI research assistant.

// Research question:
// ${question}

// Web search results:
// ${JSON.stringify(sources)}

// Write your report using these headings:
// ## 1. Executive Summary
// ## 2. Key Findings
// ## 3. Advantages and Disadvantages
// ## 4. Real-World Examples
// ## 5. Conclusion

// Research and citation rules:
// - Cite each important factual claim using a normal Markdown link.
// - Use only URLs provided in the supplied web search results.
// - Never place multiple Markdown links inside an extra pair of square brackets.
// - Do not invent, modify, or reconstruct URLs.
// - Match each claim to the most relevant source content.
// - Do not use a source if its supplied content does not support the claim.
// - If a statistic cannot be verified from the supplied source content, omit it or explicitly label it unverified.
// - Clearly distinguish sourced facts from your own analysis.
// - If the available evidence is insufficient, say so.
// - Use the supplied search results as primary evidence for current facts.
// - Cite claims inline using Markdown links with the exact source URLs provided.
// - Only cite URLs that appear in the supplied search results.
// - Ensure each citation is relevant to the claim it supports.
// - Never invent statistics, dates, facts, quotations, or citations.
// - Do not present unsupported claims as verified facts.
// - If sources disagree, explain the disagreement.
// - Clearly identify statistics that cannot be verified from the results.
// - If search results are empty, disclose that the answer relies on general model knowledge.
// - Distinguish evidence-based findings from your own analysis.
// - Use clear, beginner-friendly language.
// - Do not claim to have verified a source unless the supplied evidence supports that claim.

// Important:
// The presence of a URL does not automatically prove a claim.
// If the search results do not provide enough evidence, explicitly say so.`,

//             },
//             {
//                 role: "user",
//                 content: `Research question:
// ${question}

// Web search results:
// ${JSON.stringify(sources)}`,
//             },
//         ],
//     });

//     function cleanResearchAnswer(text) {
//         return text
//             .replace(/\\([#*_[\]()])/g, "$1")
//             .replace(/\\:/g, ":")
//             .replace(/\\\./g, ".")
//             .replace(/\\-/g, "-")
//             .trim();
//     }

//     const answer = completion.choices[0]?.message?.content;

//     if (typeof answer !== "string" || !answer.trim()) {
//         throw new Error("Groq returned an empty answer");
//     }

//     return answer;
// }



// async function searchWeb(question) {
//     if (!tvly) {
//         throw new Error("Tavily API key is not configured.");
//     }

//     const result = await tvly.search(question, {
//         searchDepth: "basic",
//         maxResults: 5,
//     });

//     return (result.results || []).map((item) => ({
//         title: item.title,
//         url: item.url,
//         content: item.content,
//     }));
// }

// app.post("/api/research", async (req, res) => {
//     const question = req.body?.question;

//     if (typeof question !== "string" || !question.trim()) {
//         return res.status(400).json({
//             success: false,
//             error: "Please enter a research question.",
//         });
//     }

//     if (question.length > 2000) {
//         return res.status(400).json({
//             success: false,
//             error: "Question must be 2000 characters or fewer.",
//         });
//     }

//     const cleanQuestion = question.trim();
//     let sources = [];

//     if (tvly) {
//         try {
//             sources = await searchWeb(cleanQuestion);
//         } catch (error) {
//             console.error("Tavily search failed:", error.message);
//         }
//     }
//     const failures = [];

//     // 1. Try Gemini, with one retry for temporary errors
//     if (ai) {
//         try {
//             const validatedAnswer = validateCitationUrls(answer, sources);

//             res.json({
//                 success: true,
//                 answer: validatedAnswer,
//                 provider,
//                 sources,
//             });
//         } catch (error) {
//             console.error("Gemini failed:", error.status, error.message);
//             failures.push("Gemini");
//         }
//     }

//     // 2. Fall back to Groq
//     if (groq) {
//         try {
//             const answer = await askGroq(cleanQuestion, sources);

//             return res.json({
//                 success: true,
//                 answer,
//                 provider: "groq",
//                 sources,
//             });
//         } catch (error) {
//             console.error("Groq failed:", error.status, error.message);
//             failures.push("Groq");
//         }
//     }

//     // 3. Neither provider succeeded
//     if (!ai && !groq) {
//         return res.status(503).json({
//             success: false,
//             error: "Configure at least one AI provider API key.",
//         });
//     }

//     return res.status(503).json({
//         success: false,
//         error:
//             "Our AI services are temporarily unavailable. Please try again shortly.",
//     });
// });


// function validateCitationUrls(answer, sources = []) {
//     const allowedUrls = new Set(
//         sources
//             .map((source) => source.url)
//             .filter((url) => typeof url === "string")
//             .map((url) => {
//                 try {
//                     return new URL(url).href;
//                 } catch {
//                     return null;
//                 }
//             })
//             .filter(Boolean)
//     );

//     const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

//     return answer.replace(
//         markdownLinkPattern,
//         (match, title, url) => {
//             try {
//                 const parsed = new URL(url);
//                 if (!["http:", "https:"].includes(parsed.protocol)) {
//                     return title;
//                 }

//                 if (!allowedUrls.has(parsed.href)) {
//                     return `${title} (unverified link)`;
//                 }

//                 return match;
//             } catch {
//                 return title;
//             }
//         }
//     );
// }

// // List models for development/testing
// app.get("/api/models", async (req, res) => {
//     try {
//         if (!ai) {
//             return res.status(500).json({
//                 success: false,
//                 error: "Gemini API key is not configured.",
//             });
//         }

//         const models = await ai.models.list();
//         const available = [];

//         for await (const model of models) {
//             if (model.supportedActions?.includes("generateContent")) {
//                 available.push(model.name);
//             }
//         }

//         return res.json({
//             success: true,
//             models: available,
//         });
//     } catch (error) {
//         console.error("Model list error:", error.message);

//         return res.status(502).json({
//             success: false,
//             error: "Could not list Gemini models.",
//         });
//     }
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });