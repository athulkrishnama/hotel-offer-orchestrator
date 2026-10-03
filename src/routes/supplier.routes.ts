import { Router, Request, Response } from "express";
import { supplierAData } from "../suppliers/supplierA";
import { supplierBData } from "../suppliers/supplierB";
import { simulateSupplier } from "../services/supplier-simulator.service";

const router = Router();

/**
 * GET /supplierA/hotels?city=delhi
 * Mock Supplier A API with random delay and random failure.
 */
router.get("/supplierA/hotels", async (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;

  if (!city) {
    res.status(400).json({ message: "city is required" });
    return;
  }

  try {
    const hotels = await simulateSupplier("Supplier A", city, supplierAData);
    res.json(hotels);
  } catch (error) {
    res.status(503).json({ message: "Supplier A unavailable" });
  }
});

/**
 * GET /supplierB/hotels?city=delhi
 * Mock Supplier B API with random delay and random failure.
 */
router.get("/supplierB/hotels", async (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;

  if (!city) {
    res.status(400).json({ message: "city is required" });
    return;
  }

  try {
    const hotels = await simulateSupplier("Supplier B", city, supplierBData);
    res.json(hotels);
  } catch (error) {
    res.status(503).json({ message: "Supplier B unavailable" });
  }
});

export default router;
