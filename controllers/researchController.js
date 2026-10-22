
const {
    runResearch,
} = require("../services/researchService");

exports.research = async (req, res) => {
    try {
        const { question } = req.body || {};

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

        const result = await runResearch(cleanQuestion);

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Research endpoint error:", error.message);

        const status = error.status || 500;

        return res.status(status).json({
            success: false,
            error:
                status === 503
                    ? error.message
                    : "An unexpected server error occurred.",
        });
    }
};
