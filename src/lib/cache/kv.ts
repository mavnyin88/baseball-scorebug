import { Redis } from "@upstash/redis";

// Thin cache abstraction over Upstash Redis with a stale-while-revalidate
// helper. Falls back to an in-process Map when KV creds are missing
// (local dev without a linked store).

type Entry<T> = { value: T; freshUntil: number; staleUntil: number };

interface Store {
  get<T>(key: string): Promise<Entry<T> | null>;
  set<T>(key: string, entry: Entry<T>, ttlSeconds: number): Promise<void>;
}

class RedisStore implements Store {
  constructor(private readonly redis: Redis) {}
  async get<T>(key: string) {
    return (await this.redis.get<Entry<T>>(key)) ?? null;
  }
  async set<T>(key: string, entry: Entry<T>, ttlSeconds: number) {
    await this.redis.set(key, entry, { ex: ttlSeconds });
  }
}

class MemoryStore implements Store {
  private readonly map = new Map<string, { entry: Entry<unknown>; expiresAt: number }>();
  async get<T>(key: string) {
    const hit = this.map.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return hit.entry as Entry<T>;
  }
  async set<T>(key: string, entry: Entry<T>, ttlSeconds: number) {
    this.map.set(key, {
      entry: entry as Entry<unknown>,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

let cachedStore: Store | null = null;
function store(): Store {
  if (cachedStore) return cachedStore;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    cachedStore = new RedisStore(new Redis({ url, token }));
  } else {
    cachedStore = new MemoryStore();
  }
  return cachedStore;
}

export interface SwrOptions {
  /** Seconds the value is considered fresh — served without revalidation. */
  freshSeconds: number;
  /** Seconds beyond fresh during which a stale value can be served while we
   *  revalidate in the background. */
  staleSeconds: number;
}

/**
 * Stale-while-revalidate fetch. Returns cached fresh value if available;
 * returns stale value while triggering a background refresh; otherwise
 * fetches synchronously.
 */
export async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  { freshSeconds, staleSeconds }: SwrOptions,
): Promise<T> {
  const s = store();
  const now = Date.now();
  const hit = await s.get<T>(key);

  if (hit && now < hit.freshUntil) return hit.value;

  if (hit && now < hit.staleUntil) {
    // Fire-and-forget revalidation.
    void revalidate(key, fetcher, freshSeconds, staleSeconds);
    return hit.value;
  }

  return revalidate(key, fetcher, freshSeconds, staleSeconds);
}

async function revalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  freshSeconds: number,
  staleSeconds: number,
): Promise<T> {
  const value = await fetcher();
  const now = Date.now();
  const entry: Entry<T> = {
    value,
    freshUntil: now + freshSeconds * 1000,
    staleUntil: now + (freshSeconds + staleSeconds) * 1000,
  };
  await store().set(key, entry, freshSeconds + staleSeconds);
  return value;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const hit = await store().get<T>(key);
  return hit?.value ?? null;
}
