import { SupplierHotel, HotelOffer, SupplierName } from "../types/hotel";
export function deduplicateHotels(
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
  const results = Array.from(offerMap.values());
  console.log(
    `[Hotel Service] Deduplicated ${supplierAHotels.length + supplierBHotels.length} offers into ${results.length} hotels`
  );
  return results;
}
