import express, { Request, Response, NextFunction } from "express";
import supplierRoutes from "./routes/supplier.routes";
import healthRoutes from "./routes/health.routes";
import hotelRoutes from "./routes/hotel.routes";

const app = express();

app.use(express.json());

// --- Routes ---
app.use(supplierRoutes);
app.use(healthRoutes);
app.use(hotelRoutes);

// --- Centralized Error Handler ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error Handler]", err.message);

  // Don't expose internal stack traces
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
