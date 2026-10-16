const { askForVerification } = require("./aiService");
const { askGemini, askGroq, askHuggingFace } = require("./aiService");

async function verifyClaim(claim, sources = []) {
  if (!claim?.trim()) {
    throw new Error("A claim is required.");
  }

  if (!sources.length) {
    return {
      claim,
      status: "insufficient_evidence",
      explanation: "No sources were provided.",
      sourceUrls: [],
    };
  }

  const evidence = sources.map((source, index) => ({
    id: index + 1,
    title: source.title,
    url: source.url,
    content: source.content,
  }));

  const prompt = `
Verify the following factual claim using ONLY the supplied source content.

Claim:
${claim}

Sources:
${JSON.stringify(evidence)}

Return only valid JSON in this exact format:
{
  "status": "supported | contradicted | insufficient_evidence",
  "explanation": "Briefly explain what the evidence establishes.",
  "sourceIds": [1]
}

Rules:
- supported: evidence directly supports the claim.
- contradicted: evidence directly conflicts with the claim.
- insufficient_evidence: evidence is missing, incomplete, or inconclusive.
- Never assume a source supports a claim from its title or URL alone.
- Do not use outside knowledge.
- sourceIds must contain only IDs of sources that directly support your assessment.
`;

  const providers = [
    askGemini,
    askGroq,
    askHuggingFace,
  ];

  let rawAnswer;

  for (const ask of providers) {
    try {
      rawAnswer = await ask(prompt, []);
      if (rawAnswer) break;
    } catch (error) {
      console.warn("Claim verification provider failed:", error.message);
    }
  }

  if (!rawAnswer) {
    return {
      claim,
      status: "insufficient_evidence",
      explanation: "Verification could not be completed.",
      sourceUrls: [],
    };
  }

  try {
    const jsonText = rawAnswer
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const result = JSON.parse(jsonText);
    const allowedStatuses = [
      "supported",
      "contradicted",
      "insufficient_evidence",
    ];

    if (!allowedStatuses.includes(result.status)) {
      throw new Error("Invalid verification status");
    }

    const sourceIds = Array.isArray(result.sourceIds)
      ? result.sourceIds.filter(
          (id) => Number.isInteger(id) && id >= 1 && id <= sources.length
        )
      : [];

    return {
      claim,
      status: result.status,
      explanation: String(result.explanation || ""),
      sourceUrls: sourceIds.map((id) => sources[id - 1].url),
    };
  } catch {
    return {
      claim,
      status: "insufficient_evidence",
      explanation: "The verifier returned an invalid response.",
      sourceUrls: [],
    };
  }
}

module.exports = { verifyClaim };
