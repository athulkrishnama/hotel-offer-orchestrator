import { Router, Request, Response } from "express";
import { getRedisClient } from "../redis/redis.client";
import { HealthResponse, SupplierHealthStatus } from "../types/health";
const router = Router();
const HEALTH_REDIS_KEY = "health:suppliers";
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const redis = await getRedisClient();
    const raw = await redis.get(HEALTH_REDIS_KEY);
    if (!raw) {
      const response: HealthResponse = {
        status: "starting",
        suppliers: {
          supplierA: null,
          supplierB: null,
        },
      };
      res.json(response);
      return;
    }
    const suppliers: {
      supplierA: SupplierHealthStatus;
      supplierB: SupplierHealthStatus;
    } = JSON.parse(raw);
    const aHealthy = suppliers.supplierA.status === "healthy";
    const bHealthy = suppliers.supplierB.status === "healthy";
    let overallStatus: HealthResponse["status"];
    if (aHealthy && bHealthy) {
      overallStatus = "healthy";
    } else if (aHealthy || bHealthy) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }
    const response: HealthResponse = {
      status: overallStatus,
      suppliers,
    };
    res.json(response);
  } catch (error) {
    console.error("[Health Route] Error reading health from Redis:", error);
    res.status(500).json({ message: "Failed to retrieve health status" });
  }
});
export default router;
