import { proxyActivities } from "@temporalio/workflow";
import type * as supplierActivities from "../activities/supplier.activities";
import type * as redisActivities from "../activities/redis.activities";
import { HotelOffer, SupplierHotel } from "../types/hotel";

// Proxy supplier activities with retry policy
const { getSupplierAHotels, getSupplierBHotels } = proxyActivities<
  typeof supplierActivities
>({
  startToCloseTimeout: "30s",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1s",
    backoffCoefficient: 2,
  },
});

// Proxy Redis activities (no retries needed — Redis is local infrastructure)
const { saveHotelsToRedis, getHotelsFromRedis } = proxyActivities<
  typeof redisActivities
>({
  startToCloseTimeout: "10s",
  retry: {
    maximumAttempts: 2,
    initialInterval: "500ms",
    backoffCoefficient: 2,
  },
});

/**
 * Deterministic deduplication logic — safe to run inside a Workflow.
 * Selects the cheapest offer when the same hotel appears in both suppliers.
 */
function deduplicateHotels(
  supplierAHotels: SupplierHotel[],
  supplierBHotels: SupplierHotel[]
): HotelOffer[] {
  const offerMap = new Map<string, HotelOffer>();

  for (const hotel of supplierAHotels) {
    offerMap.set(hotel.name, {
      name: hotel.name,
      price: hotel.price,
      supplier: "Supplier A",
      commissionPct: hotel.commissionPct,
    });
  }

  for (const hotel of supplierBHotels) {
    const existing = offerMap.get(hotel.name);
    if (!existing || hotel.price < existing.price) {
      offerMap.set(hotel.name, {
        name: hotel.name,
        price: hotel.price,
        supplier: "Supplier B",
        commissionPct: hotel.commissionPct,
      });
    }
  }

  return Array.from(offerMap.values());
}

export interface HotelWorkflowInput {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Temporal Workflow: Hotel Offer Orchestration.
 *
 * 1. Calls Supplier A and Supplier B in parallel (Activities).
 * 2. Deduplicates results by hotel name, selecting the cheapest offer.
 * 3. Saves deduplicated offers to Redis Sorted Set (Activity).
 * 4. Retrieves price-filtered results from Redis (Activity).
 * 5. Returns the final filtered hotel offers.
 */
export async function hotelOfferWorkflow(
  input: HotelWorkflowInput
): Promise<HotelOffer[]> {
  const { city, minPrice, maxPrice } = input;

  // Step 1: Call both suppliers in parallel
  const [supplierAResults, supplierBResults] = await Promise.all([
    getSupplierAHotels(city),
    getSupplierBHotels(city),
  ]);

  // Step 2: Deterministic deduplication (safe inside Workflow)
  const deduplicated = deduplicateHotels(supplierAResults, supplierBResults);

  // Step 3: Save to Redis (Activity)
  await saveHotelsToRedis(city, deduplicated);

  // Step 4: Retrieve with price filtering from Redis (Activity)
  const filtered = await getHotelsFromRedis(city, minPrice, maxPrice);

  return filtered;
}
