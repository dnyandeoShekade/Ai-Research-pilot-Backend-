/**
 * Input validation and sanitization for AI queries.
 */
function validateAgentInput(req, res, next) {
  const { question, documentId } = req.body || {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({
      success: false,
      error: "Question must be a non-empty string.",
    });
  }

  const cleanQuestion = question.trim();

  // Guard against massive context injections
  if (cleanQuestion.length > 4000) {
    return res.status(400).json({
      success: false,
      error: "Question length exceeds the 4,000 character maximum limit.",
    });
  }

  // Validate documentId format if provided (MongoDB ObjectId check: 24 hex characters)
  if (documentId && (typeof documentId !== "string" || !/^[a-f\d]{24}$/i.test(documentId))) {
    return res.status(400).json({
      success: false,
      error: "Invalid documentId format. Must be a 24-character hexadecimal string.",
    });
  }

  req.body.question = cleanQuestion;
  next();
}

module.exports = { validateAgentInput };
