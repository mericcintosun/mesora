// Turns one free-text sentence ("I'm in Kadıköy, vegetarian, after 19:00, 400 lira max")
// into structured constraints for website_add_my_constraints.
//
// Priority chain, one function, all paths return the same shape:
//   1. Mozilla Otari (OTARI_API_KEY) or OpenRouter (OPENROUTER_API_KEY), or a visitor's own
//      key passed per request (BYOK). This is the submission path the demo video must show.
//   2. The developer's local `claude` CLI, for zero-key local development.
//   3. A deterministic rule parser, so the product never breaks without a key.
import sampleFixture from "@/fixtures/parse/sample.json";
import { normalizeSentence } from "@/lib/cache";
import { LOG_PREFIX, OPENROUTER_API_KEY, OPENROUTER_MODEL, OTARI_API_KEY, OTARI_BASE_URL, OTARI_MODEL, VERCEL } from "@/lib/config";
import { DISTRICTS, SAMPLE_SENTENCE, type Diet, type DistrictId } from "@/lib/data";
import { isApiError } from "@/lib/errors";
import { fetchJson } from "@/lib/upstream";

export interface ParsedConstraints {
  district: DistrictId | null;
  diet: Diet;
  budgetTry: number | null;
  earliest: string | null;
}

export type ParseSource = "otari" | "openrouter" | "claude-cli" | "rules" | "fixture";

export interface ByokKey {
  provider: "otari" | "openrouter";
  key: string;
}

const SYSTEM_PROMPT = `You extract meetup constraints for a group dinner planner in Istanbul.
Return ONLY a JSON object with keys:
district: one of ${DISTRICTS.map((d) => `"${d.id}"`).join(", ")} or null,
diet: "any" | "vegetarian" | "vegan",
budgetTry: number (Turkish lira per head) or null,
earliest: "HH:MM" 24h earliest start time or null.
Never include street addresses.`;

function fold(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/** Path 3: deterministic rules. Also used to fill gaps an LLM leaves. */
export function parseWithRules(text: string): ParsedConstraints {
  const t = fold(text);
  const district = DISTRICTS.find((d) => t.includes(fold(d.name)) || t.includes(d.id))?.id ?? null;
  const diet: Diet = /vegan/.test(t) ? "vegan" : /vegetar|vejetar|no meat|etsiz/.test(t) ? "vegetarian" : "any";
  const money = t.match(/(\d{2,5})\s*(tl|lira|try|₺)/) ?? t.match(/(?:max|under|budget|up to)\s*(\d{2,5})/);
  const time = t.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  return {
    district,
    diet,
    budgetTry: money ? Number(money[1]) : null,
    earliest: time ? `${time[1].padStart(2, "0")}:${time[2]}` : null,
  };
}

function coerce(raw: unknown, fallback: ParsedConstraints): ParsedConstraints {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const district = DISTRICTS.find((d) => d.id === r.district)?.id ?? fallback.district;
  const diet = r.diet === "vegan" || r.diet === "vegetarian" || r.diet === "any" ? r.diet : fallback.diet;
  const budgetTry = typeof r.budgetTry === "number" && r.budgetTry > 0 ? Math.round(r.budgetTry) : fallback.budgetTry;
  const earliest = typeof r.earliest === "string" && /^\d{2}:\d{2}$/.test(r.earliest) ? r.earliest : fallback.earliest;
  return { district, diet, budgetTry, earliest };
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

/** Path 1: an OpenAI-compatible chat completion on Otari or OpenRouter. */
async function callChat(baseUrl: string, key: string, model: string, text: string): Promise<string> {
  // fetchJson applies UPSTREAM_TIMEOUT_MS and UPSTREAM_RETRIES and throws a typed ApiError.
  const data = (await fetchJson(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  })) as { choices?: { message?: { content?: string } }[] } | null;
  return data?.choices?.[0]?.message?.content ?? "";
}

let claudeAvailable: boolean | null = null;

/** Path 2: the local `claude` CLI, detected once with `claude --version`. */
async function callClaudeCli(text: string): Promise<string | null> {
  if (VERCEL) return null;
  const { spawn, spawnSync } = await import("node:child_process");
  if (claudeAvailable === null) {
    try {
      claudeAvailable = spawnSync("claude", ["--version"], { timeout: 4000 }).status === 0;
    } catch {
      claudeAvailable = false;
    }
  }
  if (!claudeAvailable) return null;
  return new Promise((resolve) => {
    const child = spawn("claude", ["-p", "--output-format", "text", "--model", "haiku"], { stdio: ["pipe", "pipe", "ignore"] });
    let out = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve(null);
    }, 30_000);
    child.stdout?.on("data", (c: Buffer) => (out += c.toString()));
    child.on("close", () => {
      clearTimeout(timer);
      resolve(out || null);
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.stdin?.write(`${SYSTEM_PROMPT}\n\nSentence: ${text}`);
    child.stdin?.end();
  });
}

export interface ParseResult {
  constraints: ParsedConstraints;
  source: ParseSource;
}

/** True when the sentence is the demo's SAMPLE_SENTENCE, ignoring case and spacing. */
export function isSampleSentence(text: string): boolean {
  return normalizeSentence(text) === normalizeSentence(SAMPLE_SENTENCE);
}

/**
 * The named fallback when no provider answers: the committed fixture for the demo
 * sentence (statically imported, never read with fs), the rule parser for anything else.
 * Both return the same shape, so the join flow renders the same card.
 */
export function fallbackParse(text: string): ParseResult {
  const rules = parseWithRules(text);
  if (isSampleSentence(text)) return { constraints: coerce(sampleFixture.constraints, rules), source: "fixture" };
  return { constraints: rules, source: "rules" };
}

export async function parseConstraints(text: string, byok?: ByokKey): Promise<ParseResult> {
  const rules = parseWithRules(text);

  const otariKey = byok?.provider === "otari" ? byok.key : OTARI_API_KEY;
  const routerKey = byok?.provider === "openrouter" ? byok.key : OPENROUTER_API_KEY;

  try {
    if (otariKey && OTARI_BASE_URL) {
      const out = await callChat(OTARI_BASE_URL, otariKey, OTARI_MODEL, text);
      return { constraints: coerce(extractJson(out), rules), source: "otari" };
    }
    if (routerKey) {
      const out = await callChat("https://openrouter.ai/api/v1", routerKey, OPENROUTER_MODEL, text);
      return { constraints: coerce(extractJson(out), rules), source: "openrouter" };
    }
  } catch (err) {
    // Provider failure or timeout: straight to the deterministic fallback. The sentence
    // itself is never logged.
    console.log(`${LOG_PREFIX} parse fallback reason=${isApiError(err) ? err.error : "provider_error"}`);
    return fallbackParse(text);
  }

  const cli = await callClaudeCli(text);
  if (cli) return { constraints: coerce(extractJson(cli), rules), source: "claude-cli" };

  return fallbackParse(text);
}
