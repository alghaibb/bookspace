import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
})

export const checkRateLimit = async (key: string, limit: number, window: string): Promise<boolean> => {
  try {
    const { success } = await rateLimit.limit(key);
    return success;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return false;
  }
}