// In-memory TTL cache, the only server memory in Mesora. It holds travel matrices (keyed
// by the districts and venues in a solve) and parsed sentences (keyed by sentenceKey).
// Module scope only: it lives as long as the server instance and never touches disk.
// It is a response cache, not persistence: no group state is ever stored here.
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

/** Lowercased, NFC, trimmed, whitespace collapsed: one form per sentence. */
export function normalizeSentence(text: string): string {
  return text.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** sha1 of the normalized sentence, prefixed so it never meets a travel-matrix key. */
export function sentenceKey(text: string): string {
  return `parse:${createHash("sha1").update(normalizeSentence(text)).digest("hex")}`;
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
