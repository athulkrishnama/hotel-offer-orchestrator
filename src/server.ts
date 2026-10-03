import "dotenv/config";
import app from "./app";
import { HealthMonitorService } from "./services/health-monitor.service";
import { disconnectRedis } from "./redis/redis.client";
const PORT = parseInt(process.env.PORT || "3000", 10);
const healthMonitor = new HealthMonitorService();
const server = app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  healthMonitor.start();
});
const shutdown = async () => {
  console.log("[Server] Shutting down...");
  healthMonitor.stop();
  await disconnectRedis();
  server.close(() => {
    console.log("[Server] Stopped");
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
