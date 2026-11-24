// The adapter seam. Pages and API routes read groups, venues and plans through
// getAdapter(), never from the seed directly. `fake` serves the seed and its cached
// travel table; `real` serves live OSRM minutes (lib/adapter-real.ts).
import { realAdapter } from "@/lib/adapter-real";
import { ADAPTER_MODE, LOG_PREFIX } from "@/lib/config";
import { GROUPS, VENUES } from "@/lib/data/seed";
import { isApiError } from "@/lib/errors";
import { solvePlan } from "@/lib/solver";
import type { Group, Participant, PlanView, Venue } from "@/lib/types";

export type AdapterMode = "fake" | "real";

export interface MesoraAdapter {
  mode: AdapterMode;
  listGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  listVenues(): Promise<Venue[]>;
  solve(people: Participant[]): Promise<PlanView>;
}

/** Seed-backed adapter: the cached transit table and the ten seed venues. */
export const fakeAdapter: MesoraAdapter = {
  mode: "fake",
  async listGroups() {
    return GROUPS;
  },
  async getGroup(id) {
    return GROUPS.find((g) => g.id === id);
  },
  async listVenues() {
    return VENUES;
  },
  async solve(people) {
    return solvePlan(people, VENUES);
  },
};

export function adapterMode(): AdapterMode {
  return ADAPTER_MODE === "real" ? "real" : "fake";
}

export function getAdapter(): MesoraAdapter {
  return adapterMode() === "real" ? realAdapter : fakeAdapter;
}

/** A solved plan plus which adapter actually answered. */
export interface ServedPlan {
  plan: PlanView;
  /** The adapter that produced `plan`: "fake" after a fallback, even in real mode. */
  source: AdapterMode;
  /** True when the requested adapter threw and the seed table answered instead. */
  fellBack: boolean;
}

/**
 * The named fallback for every server solve (DEMO steps 1 and 4, POST /api/plan).
 * Any throw from the requested adapter is caught here and the seed table answers, so
 * the result is labelled "seed" (or "estimate" when the real adapter already fell
 * back inside itself) and never claims "osrm".
 */
export async function solveWithFallback(adapter: MesoraAdapter, people: Participant[]): Promise<ServedPlan> {
  try {
    const plan = await adapter.solve(people);
    return { plan, source: adapter.mode, fellBack: false };
  } catch (err) {
    const reason = err instanceof Error ? err.message : isApiError(err) ? err.error : "unknown";
    console.log(`${LOG_PREFIX} fallback seed reason=${reason.replace(/\s+/g, "_").slice(0, 60)}`);
    const plan = await fakeAdapter.solve(people);
    return { plan, source: "fake", fellBack: adapter.mode !== "fake" };
  }
}
