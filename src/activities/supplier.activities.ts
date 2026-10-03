import { SupplierHotel } from "../types/hotel";

const SUPPLIER_BASE_URL =
  process.env.SUPPLIER_BASE_URL || "http://localhost:3000";

/**
 * Temporal Activity: Fetches hotels from Supplier A.
 * Makes an HTTP call to the mock Supplier A API.
 */
export async function getSupplierAHotels(
  city: string
): Promise<SupplierHotel[]> {
  const url = `${SUPPLIER_BASE_URL}/supplierA/hotels?city=${encodeURIComponent(city)}`;
  console.log(`[Supplier A Activity] Fetching from ${url}`);

  const start = Date.now();
  const response = await fetch(url);
  const elapsed = Date.now() - start;

  if (!response.ok) {
    console.error(
      `[Supplier A Activity] Failed with HTTP ${response.status} in ${elapsed}ms`
    );
    throw new Error(`Supplier A returned HTTP ${response.status}`);
  }

  const hotels: SupplierHotel[] = await response.json();
  console.log(
    `[Supplier A Activity] Received ${hotels.length} hotels in ${elapsed}ms`
  );
  return hotels;
}

/**
 * Temporal Activity: Fetches hotels from Supplier B.
 * Makes an HTTP call to the mock Supplier B API.
 */
export async function getSupplierBHotels(
  city: string
): Promise<SupplierHotel[]> {
  const url = `${SUPPLIER_BASE_URL}/supplierB/hotels?city=${encodeURIComponent(city)}`;
  console.log(`[Supplier B Activity] Fetching from ${url}`);

  const start = Date.now();
  const response = await fetch(url);
  const elapsed = Date.now() - start;

  if (!response.ok) {
    console.error(
      `[Supplier B Activity] Failed with HTTP ${response.status} in ${elapsed}ms`
    );
    throw new Error(`Supplier B returned HTTP ${response.status}`);
  }

  const hotels: SupplierHotel[] = await response.json();
  console.log(
    `[Supplier B Activity] Received ${hotels.length} hotels in ${elapsed}ms`
  );
  return hotels;
}
