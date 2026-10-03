import { proxyActivities } from "@temporalio/workflow";
import type * as supplierActivities from "../activities/supplier.activities";
import type * as redisActivities from "../activities/redis.activities";
import { HotelOffer, SupplierHotel } from "../types/hotel";
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
export async function hotelOfferWorkflow(
  input: HotelWorkflowInput
): Promise<HotelOffer[]> {
  const { city, minPrice, maxPrice } = input;
  const [supplierAResults, supplierBResults] = await Promise.all([
    getSupplierAHotels(city),
    getSupplierBHotels(city),
  ]);
  const deduplicated = deduplicateHotels(supplierAResults, supplierBResults);
  await saveHotelsToRedis(city, deduplicated);
  const filtered = await getHotelsFromRedis(city, minPrice, maxPrice);
  return filtered;
}
