
const {
  ai,
  groq,
  hf,
  askGemini,
  askGroq,
  askHuggingFace,
} = require("./aiService");

const MAX_REPORT_CLAIMS = 5;

function parseClaims(raw) {
  const cleaned = String(raw || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const claims = Array.isArray(parsed) ? parsed : parsed.claims;

  if (!Array.isArray(claims)) {
    throw new Error("The claim extractor returned an invalid response.");
  }

  return [...new Set(claims
    .filter((claim) => typeof claim === "string")
    .map((claim) => claim.trim())
    .filter((claim) => claim.length >= 20 && claim.length <= 500))]
    .slice(0, MAX_REPORT_CLAIMS);
}

async function extractReportClaims(report) {
  const prompt = `Extract up to ${MAX_REPORT_CLAIMS} specific, checkable factual claims from this research report. Ignore recommendations, opinions, headings, and unsupported general advice. Preserve dates, quantities, and named entities. Return only JSON as {"claims":["..."]}. If there are no factual claims, return {"claims":[]}.\n\nREPORT:\n${report.slice(0, 12000)}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      return parseClaims(response.text);
    } catch (error) {
      console.warn("Gemini claim extraction failed:", error.message);
    }
  }

  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      return parseClaims(response.choices[0]?.message?.content);
    } catch (error) {
      console.warn("Groq claim extraction failed:", error.message);
    }
  }

  if (hf) {
    try {
      const response = await hf.chat.completions.create({
        model: "Qwen/Qwen2.5-7B-Instruct:fastest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      return parseClaims(response.choices[0]?.message?.content);
    } catch (error) {
      console.warn("Hugging Face claim extraction failed:", error.message);
    }
  }

  return [];
}

async function verifyClaim(claim, sources = []) {
  if (typeof claim !== "string" || !claim.trim()) {
    throw new Error("A claim is required.");
  }

  if (!Array.isArray(sources) || sources.length === 0) {
    return {
      claim,
      status: "insufficient_evidence",
      explanation: "No sources were provided to verify this claim.",
      sourceUrls: [],
    };
  }

  // Give each source a stable ID and its actual retrieved content.
  const evidence = sources
    .filter(
      (source) =>
        source &&
        typeof source.url === "string" &&
        typeof source.content === "string" &&
        source.content.trim()
    )
    .map((source, index) => ({
      id: index + 1,
      title: String(source.title || "Untitled source"),
      url: source.url,
      content: source.content.slice(0, 6000),
    }));

  if (evidence.length === 0) {
    return {
      claim,
      status: "insufficient_evidence",
      explanation: "No usable source content was available.",
      sourceUrls: [],
    };
  }

  const prompt = `
You are a careful fact-checking assistant.

TASK:
Evaluate this exact factual claim using ONLY the supplied source content.

CLAIM:
${claim}

EVIDENCE:
${JSON.stringify(evidence)}

Return ONLY valid JSON in this format:
{
  "status": "supported",
  "explanation": "A concise explanation based on the evidence.",
  "sourceIds": [1]
}

Choose exactly one status:

1. "supported"
Use this only when relevant source content directly supports
the claim's key factual details.

2. "contradicted"
Use this only when relevant source content directly establishes
that one or more key details of the claim are false.

3. "insufficient_evidence"
Use this when sources are missing, unrelated, ambiguous, or
do not establish whether the claim is true or false.

STRICT RULES:
- Judge the CLAIM, not whether a report about it is well written.
- Use only the supplied source content, not outside knowledge.
- A source title or URL alone is not evidence.
- Search results that are merely related to a topic are not proof.
- The absence of a claim from search results does NOT prove it false.
- An extraordinary or implausible claim is not automatically contradicted.
- For claims involving dates, people, or events, require evidence
  that directly addresses those details.
- If evidence is mixed or too weak, choose insufficient_evidence.
- Do not invent facts, quotations, or sources.
- sourceIds must contain only IDs of sources whose content directly
  supports the selected status. Use [] if no source qualifies.
- Keep the explanation concise and grounded in the supplied content.
- Do not put Markdown fences around the JSON.
`;

  const providers = [
    askGemini,
    askGroq,
    askHuggingFace,
  ];

  for (const ask of providers) {
    try {
      const rawAnswer = await ask(prompt, []);

      if (!rawAnswer || typeof rawAnswer !== "string") {
        continue;
      }

      const jsonText = rawAnswer
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const result = JSON.parse(jsonText);

      const allowedStatuses = [
        "supported",
        "contradicted",
        "insufficient_evidence",
      ];

      if (
        !allowedStatuses.includes(result.status) ||
        typeof result.explanation !== "string" ||
        !Array.isArray(result.sourceIds)
      ) {
        throw new Error("Invalid verification response");
      }

      const validIds = new Set(evidence.map((item) => item.id));

      const sourceIds = [
        ...new Set(
          result.sourceIds.filter(
            (id) =>
              Number.isInteger(id) &&
              validIds.has(id)
          )
        ),
      ];

      // Without relevant cited evidence, avoid presenting a
      // confident status as if it were adequately supported.
      if (sourceIds.length === 0) {
        return {
          claim,
          status: "insufficient_evidence",
          explanation:
            "The response did not identify a source that directly supports its assessment.",
          sourceUrls: [],
        };
      }

      return {
        claim,
        status: result.status,
        explanation: result.explanation.trim(),
        sourceUrls: sourceIds.map(
          (id) => evidence.find((item) => item.id === id).url
        ),
      };
    } catch (error) {
      console.warn(
        "Claim verification provider failed:",
        error.message
      );
    }
  }

  return {
    claim,
    status: "insufficient_evidence",
    explanation:
      "Verification could not be completed reliably using the available AI providers.",
    sourceUrls: [],
  };
}

module.exports = { verifyClaim, extractReportClaims };
