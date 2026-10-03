import { createClient, RedisClientType } from "redis";

let client: RedisClientType | null = null;

/**
 * Returns a singleton Redis client, connecting on first call.
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (client && client.isOpen) {
    return client;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";
  client = createClient({ url }) as RedisClientType;

  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  await client.connect();
  console.log("[Redis] Connected to", url);
  return client;
}

/**
 * Gracefully disconnects the Redis client.
 */
export async function disconnectRedis(): Promise<void> {
  if (client && client.isOpen) {
    await client.quit();
    console.log("[Redis] Disconnected");
  }
}
