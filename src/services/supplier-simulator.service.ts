import { SupplierHotel } from "../types/hotel";
const FAILURE_RATE = parseFloat(process.env.SUPPLIER_FAILURE_RATE || "0.2");
const MIN_DELAY = parseInt(process.env.SUPPLIER_MIN_DELAY_MS || "200", 10);
const MAX_DELAY = parseInt(process.env.SUPPLIER_MAX_DELAY_MS || "3000", 10);
function randomDelay(): Promise<number> {
  const ms = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
  return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
}
function shouldFail(): boolean {
  return Math.random() < FAILURE_RATE;
}
export async function simulateSupplier(
  supplierName: string,
  city: string,
  hotels: SupplierHotel[]
): Promise<SupplierHotel[]> {
  const delayMs = await randomDelay();
  console.log(`[${supplierName}] Response delayed by ${delayMs}ms`);
  if (shouldFail()) {
    console.log(`[${supplierName}] Simulated failure (503)`);
    throw new Error(`${supplierName} unavailable`);
  }
  const filtered = hotels.filter(
    (h) => h.city.toLowerCase() === city.toLowerCase()
  );
  console.log(
    `[${supplierName}] Returning ${filtered.length} hotels for city=${city}`
  );
  return filtered;
}
