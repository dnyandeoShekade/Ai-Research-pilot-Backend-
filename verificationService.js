
const {
  askGemini,
  askGroq,
  askHuggingFace,
} = require("./aiService");

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

module.exports = { verifyClaim };
