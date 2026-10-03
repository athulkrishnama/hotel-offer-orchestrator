import { getRedisClient } from "../redis/redis.client";
import { SupplierHealthStatus } from "../types/health";
const HEALTH_REDIS_KEY = "health:suppliers";
export class HealthMonitorService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;
  private readonly supplierBaseUrl: string;
  constructor() {
    this.intervalMs = parseInt(
      process.env.HEALTH_CHECK_INTERVAL_MS || "10000",
      10
    );
    this.supplierBaseUrl =
      process.env.SUPPLIER_BASE_URL || "http://localhost:3000";
  }
  start(): void {
    console.log(
      `[Health Monitor] Starting with interval ${this.intervalMs}ms`
    );
    this.checkHealth();
    this.intervalId = setInterval(() => this.checkHealth(), this.intervalMs);
  }
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[Health Monitor] Stopped");
    }
  }
  private async checkHealth(): Promise<void> {
    const [supplierA, supplierB] = await Promise.all([
      this.checkSupplier("Supplier A", `${this.supplierBaseUrl}/supplierA/hotels?city=delhi`),
      this.checkSupplier("Supplier B", `${this.supplierBaseUrl}/supplierB/hotels?city=delhi`),
    ]);
    try {
      const redis = await getRedisClient();
      await redis.set(
        HEALTH_REDIS_KEY,
        JSON.stringify({ supplierA, supplierB })
      );
      console.log(
        `[Health Monitor] Status saved — A: ${supplierA.status}, B: ${supplierB.status}`
      );
    } catch (error) {
      console.error("[Health Monitor] Failed to save health to Redis:", error);
    }
  }
  private async checkSupplier(
    name: string,
    url: string
  ): Promise<SupplierHealthStatus> {
    const start = Date.now();
    try {
      const response = await fetch(url);
      const responseTimeMs = Date.now() - start;
      if (response.ok) {
        return {
          status: "healthy",
          responseTimeMs,
          lastChecked: new Date().toISOString(),
        };
      }
      return {
        status: "unhealthy",
        responseTimeMs,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - start;
      return {
        status: "unhealthy",
        responseTimeMs,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
