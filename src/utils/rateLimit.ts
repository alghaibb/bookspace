//@ts-nocheck
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const createRateLimit = (limit: number, window: string) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
  });
};

export const checkRateLimit = async (key: string, limit: number, window: string): Promise<boolean> => {
  try {
    const rateLimit = createRateLimit(limit, window);
    const { success } = await rateLimit.limit(key, { increment: false });
    return success;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return false;
  }
};
