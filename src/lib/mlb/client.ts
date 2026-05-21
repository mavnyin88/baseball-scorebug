import { z } from "zod";

const DEFAULT_BASE = "https://statsapi.mlb.com/api/v1";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRIES = 2;

export class MlbApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    cause?: unknown,
  ) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "MlbApiError";
  }
}

interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
}

function base(): string {
  return process.env.MLB_API_BASE ?? DEFAULT_BASE;
}

async function fetchJson(path: string, opts: FetchOptions = {}): Promise<unknown> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, signal } = opts;
  const url = `${base()}${path}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        // Retry 5xx; surface 4xx immediately.
        if (res.status >= 500 && attempt < retries) {
          lastErr = new MlbApiError(`MLB ${res.status} on ${path}`, res.status);
          continue;
        }
        throw new MlbApiError(`MLB ${res.status} on ${path}`, res.status);
      }
      return (await res.json()) as unknown;
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;
      // Backoff: 150ms, 450ms.
      await new Promise((r) => setTimeout(r, 150 * Math.pow(3, attempt)));
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
  throw lastErr instanceof MlbApiError
    ? lastErr
    : new MlbApiError("MLB request failed", undefined, lastErr);
}

export async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  opts?: FetchOptions,
): Promise<T> {
  const raw = await fetchJson(path, opts);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new MlbApiError(
      `MLB response failed validation for ${path}`,
      undefined,
      parsed.error,
    );
  }
  return parsed.data;
}
