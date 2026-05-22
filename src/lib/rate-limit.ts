import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Limiter = { limit(id: string): Promise<{ success: boolean; reset: number; remaining: number; limit: number }> };

let cached: Limiter | null | undefined;

export function getLimiter(): Limiter | null {
  if (cached !== undefined) return cached;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    cached = null;
    return null;
  }
  cached = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: false,
    prefix: "rl:api",
  });
  return cached;
}
