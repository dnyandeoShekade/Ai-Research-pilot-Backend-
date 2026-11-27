
const express = require("express");
const router = express.Router();

const { runAgent } = require("../services/agentService");
const { validateAgentInput } = require("../middleware/validator");

router.post("/", validateAgentInput, async (req, res) => {
  try {
    const { question, documentId } = req.body;

    const result = await runAgent(question, { documentId });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Agent error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Agent request failed",
    });
  }
});

module.exports = router;
