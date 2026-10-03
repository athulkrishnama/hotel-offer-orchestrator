import { SupplierHotel, HotelOffer, SupplierName } from "../types/hotel";

/**
 * Deduplicates hotels by name and selects the cheapest offer when
 * the same hotel appears in both suppliers.
 *
 * This is a pure, deterministic function suitable for Temporal Workflow code.
 */
export function deduplicateHotels(
  supplierAHotels: SupplierHotel[],
  supplierBHotels: SupplierHotel[]
): HotelOffer[] {
  const offerMap = new Map<string, HotelOffer>();

  // Add all Supplier A hotels
  for (const hotel of supplierAHotels) {
    offerMap.set(hotel.name, {
      name: hotel.name,
      price: hotel.price,
      supplier: "Supplier A",
      commissionPct: hotel.commissionPct,
    });
  }

  // Merge Supplier B hotels — keep cheaper offer on overlap
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

  const results = Array.from(offerMap.values());

  console.log(
    `[Hotel Service] Deduplicated ${supplierAHotels.length + supplierBHotels.length} offers into ${results.length} hotels`
  );

  return results;
}
