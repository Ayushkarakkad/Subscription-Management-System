import "dotenv/config";
import app from "./app";
import { prisma } from "./config/database";
import { initializeRecurringBillingJob } from "./cron";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected successfully to subscription_management");

    // Initialize recurring billing scheduler
    initializeRecurringBillingJob();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Brightloop Backend Server running on port ${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        await prisma.$disconnect();
        console.log("Database disconnected. Server stopped.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();

