import { HotelOffer } from "../types/hotel";
import { getRedisClient } from "../redis/redis.client";
export async function saveHotelsToRedis(
  city: string,
  hotels: HotelOffer[]
): Promise<void> {
  const redis = await getRedisClient();
  const key = `hotels:${city.toLowerCase()}`;
  await redis.del(key);
  if (hotels.length === 0) {
    console.log(`[Redis Activity] No hotels to save for ${city}`);
    return;
  }
  for (const hotel of hotels) {
    await redis.zAdd(key, {
      score: hotel.price,
      value: JSON.stringify(hotel),
    });
  }
  console.log(`[Redis Activity] Saved ${hotels.length} hotels for ${city}`);
}
export async function getHotelsFromRedis(
  city: string,
  minPrice?: number,
  maxPrice?: number
): Promise<HotelOffer[]> {
  const redis = await getRedisClient();
  const key = `hotels:${city.toLowerCase()}`;
  const min = minPrice !== undefined ? minPrice : "-inf";
  const max = maxPrice !== undefined ? maxPrice : "+inf";
  const results = await redis.zRangeByScore(key, min, max);
  const hotels: HotelOffer[] = results.map((r) => JSON.parse(r));
  console.log(
    `[Redis Activity] Retrieved ${hotels.length} hotels for ${city} (price: ${min}–${max})`
  );
  return hotels;
}
