// The one place server code calls fetch(). Every call gets UPSTREAM_TIMEOUT_MS through
// an AbortController and at most UPSTREAM_RETRIES retry, then throws a typed ApiError.
// Provider text never leaves this file.
import { UPSTREAM_RETRIES, UPSTREAM_TIMEOUT_MS } from "@/lib/config";
import { apiError, isApiError, type ApiError } from "@/lib/errors";

async function attempt(url: string, init: RequestInit | undefined): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    } catch {
      if (controller.signal.aborted) throw apiError("upstream_timeout", `No answer within ${UPSTREAM_TIMEOUT_MS} ms.`);
      throw apiError("upstream_error", "The upstream service could not be reached.");
    }
    if (!res.ok) throw apiError("upstream_error", `The upstream service answered with HTTP ${res.status}.`);
    try {
      return await res.json();
    } catch {
      throw apiError("parse_failure", "The upstream service did not return JSON.");
    }
  } finally {
    clearTimeout(timer);
  }
}

/** GET (or the given init) and parse JSON. One try plus UPSTREAM_RETRIES retry, no loop. */
export async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  let first: ApiError;
  try {
    return await attempt(url, init);
  } catch (err) {
    first = isApiError(err) ? err : apiError("upstream_error", "The upstream call failed.");
  }
  if (UPSTREAM_RETRIES < 1 || first.error === "parse_failure") throw first;
  try {
    return await attempt(url, init);
  } catch (err) {
    throw isApiError(err) ? err : apiError("upstream_error", "The upstream call failed.");
  }
}
