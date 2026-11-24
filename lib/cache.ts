// In-memory TTL cache for travel matrices, keyed by the districts and venues in a solve.
// Module scope only: it lives as long as the server instance and never touches disk.
import { createHash } from "node:crypto";
import { CACHE_TTL_MS } from "@/lib/config";

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();
const MAX_ENTRIES = 200;

/** sha1 of the sorted district ids plus the sorted venue ids. */
export function cacheKey(districtIds: readonly string[], venueIds: readonly string[]): string {
  const d = [...new Set(districtIds)].sort().join(",");
  const v = [...new Set(venueIds)].sort().join(",");
  return createHash("sha1").update(`${d}|${v}`).digest("hex");
}

export function getCached<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expires <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number = CACHE_TTL_MS): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}
