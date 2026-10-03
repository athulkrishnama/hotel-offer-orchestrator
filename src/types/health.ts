export interface SupplierHealthStatus {
  status: "healthy" | "unhealthy";
  responseTimeMs: number;
  lastChecked: string;
  error?: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy" | "starting";
  suppliers: {
    supplierA: SupplierHealthStatus | null;
    supplierB: SupplierHealthStatus | null;
  };
}
