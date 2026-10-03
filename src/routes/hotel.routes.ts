import { Router, Request, Response, NextFunction } from "express";
import { Connection, Client } from "@temporalio/client";
import { v4 as uuidv4 } from "crypto";
import { HotelWorkflowInput } from "../workflows/hotel.workflow";
import { HotelOffer } from "../types/hotel";

const router = Router();

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || "localhost:7233";
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || "hotel-task-queue";

let temporalClient: Client | null = null;

/**
 * Returns a singleton Temporal client, connecting on first call.
 */
async function getTemporalClient(): Promise<Client> {
  if (temporalClient) {
    return temporalClient;
  }

  const connection = await Connection.connect({
    address: TEMPORAL_ADDRESS,
  });

  temporalClient = new Client({ connection });
  console.log(`[Hotel Route] Connected to Temporal at ${TEMPORAL_ADDRESS}`);
  return temporalClient;
}

/**
 * Generates a unique workflow ID for each hotel search.
 */
function generateWorkflowId(city: string): string {
  const uniquePart = crypto.randomUUID();
  return `hotel-search-${city.toLowerCase()}-${uniquePart}`;
}

/**
 * GET /api/hotels?city=delhi&minPrice=5000&maxPrice=7000
 *
 * Starts a Temporal Workflow to fetch, deduplicate, and filter hotel offers.
 */
router.get(
  "/api/hotels",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // --- Validate query params ---
      const city = req.query.city as string | undefined;
      if (!city) {
        res.status(400).json({ message: "city is required" });
        return;
      }

      const minPriceRaw = req.query.minPrice as string | undefined;
      const maxPriceRaw = req.query.maxPrice as string | undefined;

      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (minPriceRaw !== undefined) {
        minPrice = parseFloat(minPriceRaw);
        if (isNaN(minPrice) || minPrice < 0) {
          res
            .status(400)
            .json({ message: "minPrice must be a non-negative number" });
          return;
        }
      }

      if (maxPriceRaw !== undefined) {
        maxPrice = parseFloat(maxPriceRaw);
        if (isNaN(maxPrice) || maxPrice < 0) {
          res
            .status(400)
            .json({ message: "maxPrice must be a non-negative number" });
          return;
        }
      }

      if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice > maxPrice
      ) {
        res
          .status(400)
          .json({ message: "minPrice must be less than or equal to maxPrice" });
        return;
      }

      // --- Start Temporal Workflow ---
      const client = await getTemporalClient();
      const workflowId = generateWorkflowId(city);

      console.log(`[Hotel Route] Starting workflow ${workflowId} for city=${city}`);

      const input: HotelWorkflowInput = { city, minPrice, maxPrice };

      const handle = await client.workflow.start("hotelOfferWorkflow", {
        taskQueue: TASK_QUEUE,
        workflowId,
        args: [input],
      });

      const result: HotelOffer[] = await handle.result();

      console.log(
        `[Hotel Route] Workflow ${workflowId} completed with ${result.length} hotels`
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
