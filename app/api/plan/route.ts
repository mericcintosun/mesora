import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import { MAX_PEOPLE } from "@/lib/codec";
import { DISTRICT_ORDER, type ApiResponse, type Diet, type DistrictId, type Participant, type PlanView } from "@/lib/types";

// Solves a plan from district ids, diet, budget and earliest time only. Any other
// field (coordinates, a name, the link fragment) is dropped before the solver sees it.
// Minimal on purpose: Phase 2 owns full validation and the error taxonomy.

const DIETS: Diet[] = ["any", "vegetarian", "vegan"];

function bad(message: string) {
  const body: ApiResponse<PlanView> = { ok: false, error: { code: "bad_request", message } };
  return NextResponse.json(body, { status: 400 });
}

function clean(raw: unknown, i: number): Participant | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const district = DISTRICT_ORDER.find((d) => d === r.district) as DistrictId | undefined;
  if (!district) return null;
  const diet = DIETS.find((d) => d === r.diet) ?? "any";
  const budgetTry = typeof r.budgetTry === "number" && Number.isFinite(r.budgetTry) && r.budgetTry > 0 ? Math.round(r.budgetTry) : 400;
  const earliest = typeof r.earliest === "string" && /^\d{2}:\d{2}$/.test(r.earliest) ? r.earliest : "19:00";
  return { name: `Person ${i + 1}`, district, diet, budgetTry, earliest };
}

export async function POST(req: Request) {
  let body: { participants?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad("Send JSON with a participants array.");
  }
  if (!Array.isArray(body.participants) || body.participants.length === 0) return bad("participants must be a non-empty array.");
  const people = body.participants.slice(0, MAX_PEOPLE).map(clean);
  if (people.some((p) => p === null)) return bad(`Each participant needs a district, one of ${DISTRICT_ORDER.join(", ")}.`);

  const adapter = getAdapter();
  const plan = await adapter.solve(people as Participant[]);
  const ok: ApiResponse<PlanView> = { ok: true, data: plan, source: adapter.mode };
  return NextResponse.json(ok);
}
