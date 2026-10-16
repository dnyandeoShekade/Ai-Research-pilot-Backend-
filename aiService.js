// const Groq = require("groq-sdk");
// const { GoogleGenAI } = require("@google/genai");
// const { cleanResearchAnswer } = require("./researchUtils");

// const ai = process.env.GEMINI_API_KEY
//     ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
//     : null;

// const groq = process.env.GROQ_API_KEY
//     ? new Groq({ apiKey: process.env.GROQ_API_KEY })
//     : null;

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// function isTemporaryError(error) {
//     const status = error.status || error.statusCode;
//     return (
//         [408, 429, 500, 502, 503, 504].includes(status) ||
//         ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(error.code)
//     );
// }

// // Shared instructions (dono providers ke liye same)
// const SYSTEM_PROMPT = `You are ResearchPilot, a reliable AI research assistant.

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
// - If sources disagree, explain the disagreement.
// - If search results are empty, disclose that the answer relies on general model knowledge.
// - If the available evidence is insufficient, say so.
// - Use clear, beginner-friendly language.

// Important:
// The presence of a URL does not automatically prove a claim.
// If the search results do not provide enough evidence, explicitly say so.`;

// function buildUserPrompt(question, sources) {
//     return `Research question:
// ${question}

// Web search results:
// ${JSON.stringify(sources)}`;
// }

// async function askGemini(question, sources = []) {
//     let lastError;

//     for (let attempt = 0; attempt < 2; attempt++) {
//         try {
//             const response = await ai.models.generateContent({
//                 model: "gemini-flash-lite-latest",
//                 contents: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(question, sources)}`,
//             });

//             if (!response.text?.trim()) {
//                 throw new Error("Gemini returned an empty answer");
//             }

//             return cleanResearchAnswer(response.text);
//         } catch (error) {
//             lastError = error;

//             if (!isTemporaryError(error) || attempt === 1) throw error;

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
//             { role: "system", content: SYSTEM_PROMPT },
//             { role: "user", content: buildUserPrompt(question, sources) },
//         ],
//     });

//     const answer = completion.choices[0]?.message?.content;

//     if (typeof answer !== "string" || !answer.trim()) {
//         throw new Error("Groq returned an empty answer");
//     }

//     return cleanResearchAnswer(answer);
// }

// module.exports = { ai, groq, askGemini, askGroq };

const Groq = require("groq-sdk");
const { GoogleGenAI } = require("@google/genai");
const OpenAI = require("openai");
const { cleanResearchAnswer } = require("./researchUtils");

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const hf = process.env.HF_TOKEN
  ? new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN,
    })
  : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isTemporaryError(error) {
  const status = error.status || error.statusCode;
  return (
    [408, 429, 500, 502, 503, 504].includes(status) ||
    ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(error.code)
  );
}


const SYSTEM_PROMPT = `You are ResearchPilot, a careful AI research assistant.

Write reports with these headings:
## 1. Executive Summary
## 2. Key Findings
## 3. Advantages and Disadvantages
## 4. Real-World Examples
## 5. Conclusion

Citation and accuracy rules:
- Cite factual claims using standard Markdown links:
  [Source title](https://example.com/article).
- Never wrap a Markdown link in extra square brackets.
- Only cite exact URLs supplied in the research sources.
- Ensure each cited source's supplied content supports the specific claim.
- Do not invent facts, statistics, dates, quotes, or URLs.
- Treat forecasts and estimates as forecasts, not established facts.
- For important statistics, identify the source and its stated timeframe.
- If the evidence is insufficient, say "Not verified from the available sources."
- Distinguish verified facts from analysis and recommendations.
- Do not claim that a source was verified if only its title or URL was supplied.
- Prefer relevant primary sources and original research when available.
- Use clear, beginner-friendly language.`;


function buildUserPrompt(question, sources) {
  return `Research question:
${question}

Web search results:
${JSON.stringify(sources)}`;
}

async function askGemini(question, sources = []) {
  if (!ai) throw new Error("Gemini API key is not configured.");

  let lastError;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(question, sources)}`,
      });

      if (!response.text?.trim()) {
        throw new Error("Gemini returned an empty answer");
      }

      return cleanResearchAnswer(response.text);
    } catch (error) {
      lastError = error;

      if (!isTemporaryError(error) || attempt === 1) {
        throw error;
      }

      console.warn("Gemini temporary error; retrying once...");
      await sleep(1000);
    }
  }

  throw lastError;
}

async function askGroq(question, sources = []) {
  if (!groq) throw new Error("Groq API key is not configured.");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(question, sources) },
    ],
  });

  const answer = completion.choices[0]?.message?.content;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("Groq returned an empty answer");
  }

  return cleanResearchAnswer(answer);
}

async function askHuggingFace(question, sources = []) {
  if (!hf) throw new Error("Hugging Face token is not configured.");

  const completion = await hf.chat.completions.create({
    model: "Qwen/Qwen2.5-7B-Instruct:fastest",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(question, sources) },
    ],
  });

  const answer = completion.choices[0]?.message?.content;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("Hugging Face returned an empty answer");
  }

  return cleanResearchAnswer(answer);
}

async function askForVerification(prompt) {
  const verificationPrompt = `
You are a factual claim verifier.
Use only the evidence supplied by the user.
Return ONLY valid JSON. Do not use Markdown fences.

RESEARCH ACCURACY RULES:
- Search for evidence relevant to every report section.
- Include only findings supported by the supplied source content.
- If evidence is insufficient, clearly state that.
- A URL existing does not mean a claim is verified.
- Cite the source that directly supports each factual claim.
- Do not invent facts, sources, quotations, or citations.
- Keep the report focused on the user's intended topic.
- Exclude unrelated meanings or information.
- Never present an AI-generated assessment as confirmed fact.

Required format:
{
  "status": "supported",
  "explanation": "Evidence directly supports the claim.",
  "sourceIds": [1]
}

Allowed status values:
- supported
- contradicted
- insufficient_evidence

Never invent evidence or source IDs.
If evidence is inconclusive, return insufficient_evidence.

Task:
${prompt}
`;

  // Try Gemini first.
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: verificationPrompt,
      });

      if (response.text?.trim()) {
        return response.text.trim();
      }
    } catch (error) {
      console.warn("Gemini verification failed:", error.message);
    }
  }

  // Fall back to Groq.
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: verificationPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const answer = completion.choices[0]?.message?.content;

      if (answer?.trim()) return answer.trim();
    } catch (error) {
      console.warn("Groq verification failed:", error.message);
    }
  }

  // Fall back to Hugging Face.
  if (hf) {
    const completion = await hf.chat.completions.create({
      model: "Qwen/Qwen2.5-7B-Instruct:fastest",
      messages: [
        { role: "user", content: verificationPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const answer = completion.choices[0]?.message?.content;

    if (answer?.trim()) return answer.trim();
  }

  throw new Error("No AI provider could verify the claim.");
}

module.exports = {
  ai,
  groq,
  hf,
  askGemini,
  askGroq,
  askHuggingFace,
  askForVerification,
};