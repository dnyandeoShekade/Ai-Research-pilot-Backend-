const express = require("express");
const cors = require("cors");

const documentRoutes = require("./routes/documentRoutes");
const apiRoutes = require("./routes/apiRoutes");
const agentRoutes = require("./routes/agentRoutes");
const app = express();

// Middleware
app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||

            "http://localhost:3000",
    })
);

app.use(express.json({ limit: "20kb" }));
app.use("/api/documents", documentRoutes);
app.use("/api", apiRoutes);
app.use("/api/agent", agentRoutes);
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

module.exports = app;
