// Thin entry point kept for existing imports. Types live in lib/types.ts, seed
// values in lib/data/seed.ts. Pages and API routes should read groups through
// getAdapter() in lib/adapter.ts; these helpers stay for client components and the solver.
import { DISTRICTS, GROUPS } from "@/lib/data/seed";
import type { District, DistrictId, Group } from "@/lib/types";

export type { Diet, District, DistrictId, Group, Participant, Side, Venue } from "@/lib/types";
export {
  BUDGET_OPTIONS,
  DIET_OPTIONS,
  DISTRICTS,
  DISTRICT_ORDER,
  GROUPS,
  OPEN_INVITE,
  SAMPLE_SENTENCE,
  TIME_OPTIONS,
  VENUES,
} from "@/lib/data/seed";

export function getGroup(id: string): Group | undefined {
  return GROUPS.find((g) => g.id === id);
}

export function getDistrict(id: DistrictId): District {
  return DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
}
