const express = require("express");
const cors = require("cors");
const { requestLogger, metrics } = require("./middleware/requestLogger");
const { createRateLimiter } = require("./middleware/rateLimiter");

const documentRoutes = require("./routes/documentRoutes");
const apiRoutes = require("./routes/apiRoutes");
const agentRoutes = require("./routes/agentRoutes");
const app = express();

// Telemetry & Request Logging
app.use(requestLogger);

// Register health‑check endpoint
const healthRouter = require('./health');
app.use('/healthz', healthRouter);

// Metrics endpoint for AI observability
app.get('/api/metrics', (req, res) => {
    res.json({
        success: true,
        metrics: {
            totalRequests: metrics.totalRequests,
            agentQueries: metrics.agentQueries,
            documentUploads: metrics.documentUploads,
            errors: metrics.errors,
            averageLatencyMs: metrics.getAverageLatency(),
        },
    });
});

// AI Rate Limiter (protect expensive model endpoints: max 40 requests/minute per IP)
const aiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 40,
    message: "AI query rate limit exceeded. Please wait a minute before making more research queries.",
});
app.use("/api/agent", aiRateLimiter);

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
