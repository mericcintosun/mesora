import { NextResponse } from "next/server";
import { fallbackParse, parseConstraints, type ParseResult } from "@/lib/agent/parse-constraints";
import { getCached, sentenceKey, setCached } from "@/lib/cache";
import { apiError, type ErrorCode } from "@/lib/errors";
import { hintFrom, parseInputSchema } from "@/lib/schemas";

export const runtime = "nodejs";

// Receives only the sentence the visitor typed (never the group link or its #g=
// fragment, which the browser does not send and this route never logs) and returns
// structured constraints. Nothing is stored except the parsed answer in the in-memory
// response cache (lib/cache.ts), keyed by a sha1 of the normalized sentence, so the
// same sentence always gets the same answer. A visitor's own key may ride along per
// request and is used once, never logged or cached.

type ParseResponse = ({ ok: true; cached: boolean } & ParseResult) | { ok: false; error: ErrorCode; hint: string };

function fail(code: ErrorCode, hint: string, status: number) {
  const body: ParseResponse = { ok: false, ...apiError(code, hint) };
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const parsed = parseInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("invalid_input", raw === null ? "Send JSON with a text field." : hintFrom(parsed.error), 400);
  }
  const { text, byok } = parsed.data;

  const key = sentenceKey(text);
  const hit = getCached<ParseResult>(key);
  if (hit) {
    const body: ParseResponse = { ok: true, cached: true, ...hit };
    return NextResponse.json(body);
  }

  let result: ParseResult;
  try {
    result = await parseConstraints(text, byok);
  } catch {
    // parseConstraints already falls back on provider errors; this covers anything else.
    result = fallbackParse(text);
  }
  setCached(key, result);
  const body: ParseResponse = { ok: true, cached: false, ...result };
  return NextResponse.json(body);
}
