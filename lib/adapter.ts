// The adapter seam. Pages and API routes read groups, venues and plans through
// getAdapter(), never from the seed directly, so Phase 2 can swap in live data
// without touching any screen.
import { GROUPS, VENUES } from "@/lib/data/seed";
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
  return process.env.ADAPTER_MODE === "real" ? "real" : "fake";
}

export function getAdapter(): MesoraAdapter {
  if (adapterMode() === "real") {
    // TODO(Phase 2): return the real adapter here: OSRM table for trip minutes,
    // Overpass for candidate venues, both with the seed as the offline fallback.
    return fakeAdapter;
  }
  return fakeAdapter;
}
