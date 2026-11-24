// The only module that reads process.env (besides next.config.ts and the build-time
// NEXT_PUBLIC_BRAND_FILES key in lib/brand-files.ts). Server code only: never import
// this from a "use client" file.

export type AdapterModeValue = "fake" | "real";

/** `fake` (seed data, the default) or `real` (live OSRM travel minutes). */
export const ADAPTER_MODE: AdapterModeValue = process.env.ADAPTER_MODE === "real" ? "real" : "fake";

/** Keyless public OSRM by default; a self-hosted OSRM URL also works. */
export const OSRM_BASE_URL: string = (process.env.OSRM_BASE_URL || "https://router.project-osrm.org").replace(/\/+$/, "");

export const UPSTREAM_TIMEOUT_MS = 8000;
export const UPSTREAM_RETRIES = 1;
/** Solved travel matrices stay in memory for 10 minutes per server instance. */
export const CACHE_TTL_MS = 10 * 60 * 1000;

export const LOG_PREFIX = "[core]";

// Agent parser keys (lib/agent/parse-constraints.ts).
export const OTARI_API_KEY: string | undefined = process.env.OTARI_API_KEY || undefined;
export const OTARI_BASE_URL: string | undefined = process.env.OTARI_BASE_URL || undefined;
export const OTARI_MODEL: string = process.env.OTARI_MODEL || "alibaba/qwen3.8-flash";
export const OPENROUTER_API_KEY: string | undefined = process.env.OPENROUTER_API_KEY || undefined;
export const OPENROUTER_MODEL: string = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
/** Set by Vercel; when present the local `claude` CLI path is skipped. */
export const VERCEL: boolean = !!process.env.VERCEL;
