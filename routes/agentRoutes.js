
const express = require("express");
const router = express.Router();

const { runAgent } = require("../services/agentService");

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // Add the line here, after validating question
    const result = await runAgent(question);

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
