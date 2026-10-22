const path = require("path");

// Load environment variables first
require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const connectDB = require("./utils/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`ResearchPilot backend running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();
