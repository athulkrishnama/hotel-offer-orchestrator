import { HotelOffer } from "../types/hotel";
import { getRedisClient } from "../redis/redis.client";

/**
 * Temporal Activity: Saves deduplicated hotel offers to Redis as a Sorted Set.
 * Uses hotel price as the score for price-range filtering.
 */
export async function saveHotelsToRedis(
  city: string,
  hotels: HotelOffer[]
): Promise<void> {
  const redis = await getRedisClient();
  const key = `hotels:${city.toLowerCase()}`;

  // Clear previous results for this city
  await redis.del(key);

  if (hotels.length === 0) {
    console.log(`[Redis Activity] No hotels to save for ${city}`);
    return;
  }

  // Add each hotel to a sorted set with price as the score
  for (const hotel of hotels) {
    await redis.zAdd(key, {
      score: hotel.price,
      value: JSON.stringify(hotel),
    });
  }

  console.log(`[Redis Activity] Saved ${hotels.length} hotels for ${city}`);
}

/**
 * Temporal Activity: Retrieves hotel offers from Redis, optionally filtered by price range.
 * Filtering is done inside Redis using ZRANGEBYSCORE — not in JavaScript.
 */
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
