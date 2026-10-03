import { deduplicateHotels } from "./hotel.service";
import { SupplierHotel } from "../types/hotel";
describe("deduplicateHotels", () => {
  it("should select the cheaper offer when same hotel exists in both suppliers", () => {
    const supplierA: SupplierHotel[] = [
      { hotelId: "a1", name: "Holtin", price: 6000, city: "delhi", commissionPct: 10 },
    ];
    const supplierB: SupplierHotel[] = [
      { hotelId: "b1", name: "Holtin", price: 5340, city: "delhi", commissionPct: 20 },
    ];
    const result = deduplicateHotels(supplierA, supplierB);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Holtin",
      price: 5340,
      supplier: "Supplier B",
      commissionPct: 20,
    });
  });
  it("should keep Supplier A offer when only A has the hotel", () => {
    const supplierA: SupplierHotel[] = [
      { hotelId: "a3", name: "Taj Palace", price: 8500, city: "delhi", commissionPct: 15 },
    ];
    const supplierB: SupplierHotel[] = [];
    const result = deduplicateHotels(supplierA, supplierB);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Taj Palace",
      price: 8500,
      supplier: "Supplier A",
      commissionPct: 15,
    });
  });
  it("should keep Supplier B offer when only B has the hotel", () => {
    const supplierA: SupplierHotel[] = [];
    const supplierB: SupplierHotel[] = [
      { hotelId: "b3", name: "Le Meridian", price: 7200, city: "delhi", commissionPct: 18 },
    ];
    const result = deduplicateHotels(supplierA, supplierB);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Le Meridian",
      price: 7200,
      supplier: "Supplier B",
      commissionPct: 18,
    });
  });
  it("should handle multiple overlapping hotels and produce one result per hotel name", () => {
    const supplierA: SupplierHotel[] = [
      { hotelId: "a1", name: "Holtin", price: 6000, city: "delhi", commissionPct: 10 },
      { hotelId: "a2", name: "Radison", price: 5900, city: "delhi", commissionPct: 13 },
      { hotelId: "a3", name: "Taj Palace", price: 8500, city: "delhi", commissionPct: 15 },
    ];
    const supplierB: SupplierHotel[] = [
      { hotelId: "b1", name: "Holtin", price: 5340, city: "delhi", commissionPct: 20 },
      { hotelId: "b2", name: "Radison", price: 6200, city: "delhi", commissionPct: 11 },
      { hotelId: "b3", name: "Le Meridian", price: 7200, city: "delhi", commissionPct: 18 },
    ];
    const result = deduplicateHotels(supplierA, supplierB);
    expect(result).toHaveLength(4);
    const holtin = result.find((h) => h.name === "Holtin");
    expect(holtin).toEqual({
      name: "Holtin",
      price: 5340,
      supplier: "Supplier B",
      commissionPct: 20,
    });
    const radison = result.find((h) => h.name === "Radison");
    expect(radison).toEqual({
      name: "Radison",
      price: 5900,
      supplier: "Supplier A",
      commissionPct: 13,
    });
    const taj = result.find((h) => h.name === "Taj Palace");
    expect(taj).toEqual({
      name: "Taj Palace",
      price: 8500,
      supplier: "Supplier A",
      commissionPct: 15,
    });
    const meridian = result.find((h) => h.name === "Le Meridian");
    expect(meridian).toEqual({
      name: "Le Meridian",
      price: 7200,
      supplier: "Supplier B",
      commissionPct: 18,
    });
  });
  it("should return an empty array when both suppliers return empty (unknown city)", () => {
    const result = deduplicateHotels([], []);
    expect(result).toEqual([]);
  });
  it("should keep Supplier A when prices are equal", () => {
    const supplierA: SupplierHotel[] = [
      { hotelId: "a1", name: "Equal Hotel", price: 5000, city: "delhi", commissionPct: 10 },
    ];
    const supplierB: SupplierHotel[] = [
      { hotelId: "b1", name: "Equal Hotel", price: 5000, city: "delhi", commissionPct: 15 },
    ];
    const result = deduplicateHotels(supplierA, supplierB);
    expect(result).toHaveLength(1);
    expect(result[0].supplier).toBe("Supplier A");
  });
});
