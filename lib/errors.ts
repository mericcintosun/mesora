// The error taxonomy every JSON route (except /api/parse) uses in its failure arm.

export type ErrorCode = "invalid_input" | "upstream_timeout" | "upstream_error" | "parse_failure" | "not_configured";

export type ApiError = { error: ErrorCode; hint: string };

export function apiError(error: ErrorCode, hint: string): ApiError {
  return { error, hint };
}

export function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.error === "string" && typeof v.hint === "string";
}
