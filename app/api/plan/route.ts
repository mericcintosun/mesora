import { NextResponse } from "next/server";
import { getAdapter, solveWithFallback } from "@/lib/adapter";
import { apiError } from "@/lib/errors";
import { hintFrom, planInputSchema } from "@/lib/schemas";
import type { ApiResponse, Participant, PlanView } from "@/lib/types";

// Solves a plan from district ids, diet, budget and earliest time only. The zod schema
// strips every other field (coordinates, a name, the link fragment) before the solver
// sees the body, and names become "Person n".

// Live OSRM minutes on every request in real mode; never prerendered.
export const dynamic = "force-dynamic";

function invalid(hint: string) {
  const body: ApiResponse<PlanView> = { ok: false, ...apiError("invalid_input", hint) };
  return NextResponse.json(body, { status: 400 });
}

export async function POST(req: Request) {
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const parsed = planInputSchema.safeParse(raw);
  if (!parsed.success) {
    return invalid(raw === null ? "Send JSON with a participants array." : hintFrom(parsed.error));
  }

  const people: Participant[] = parsed.data.participants.map((p, i) => ({
    name: `Person ${i + 1}`,
    district: p.district,
    diet: p.diet,
    budgetTry: Math.max(1, Math.round(p.budgetTry)),
    earliest: p.earliest,
  }));

  // A failed real solve still answers ok: true, from the seed table (solveWithFallback).
  // Only invalid input gets ok: false.
  const served = await solveWithFallback(getAdapter(), people);
  // data.travelSource says "seed", "osrm" or "estimate"; source says which adapter answered.
  const ok: ApiResponse<PlanView> = { ok: true, data: served.plan, source: served.source };
  return NextResponse.json(ok);
}
