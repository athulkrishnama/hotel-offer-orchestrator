import "dotenv/config";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as supplierActivities from "./activities/supplier.activities";
import * as redisActivities from "./activities/redis.activities";
import { disconnectRedis } from "./redis/redis.client";

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || "localhost:7233";
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || "hotel-task-queue";

async function main(): Promise<void> {
  console.log(`[Worker] Connecting to Temporal at ${TEMPORAL_ADDRESS}`);

  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });

  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: TASK_QUEUE,
    workflowsPath: require.resolve("./workflows/hotel.workflow"),
    activities: {
      ...supplierActivities,
      ...redisActivities,
    },
  });

  console.log(`[Worker] Listening on task queue: ${TASK_QUEUE}`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[Worker] Shutting down...");
    worker.shutdown();
    await disconnectRedis();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await worker.run();

  console.log("[Worker] Stopped");
}

main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
