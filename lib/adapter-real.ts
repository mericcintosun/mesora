// Real adapter: live OSRM driving minutes between district centers and venues.
// Groups and venues (diet, budget, opening hours) are still the seed sample list.
// Only coarse district centroids and venue coordinates go to OSRM: never a name,
// an exact location or the link fragment.
import type { MesoraAdapter } from "@/lib/adapter";
import { cacheKey, getCached, setCached } from "@/lib/cache";
import { LOG_PREFIX, OSRM_BASE_URL } from "@/lib/config";
import { getDistrict } from "@/lib/data";
import { GROUPS, VENUES } from "@/lib/data/seed";
import { isApiError } from "@/lib/errors";
import { solvePlanWith } from "@/lib/solver";
import { buildTableUrl, estimateMinutes, fillMatrix, haversineKm, parseTable } from "@/lib/travel-core";
import type { DistrictId, Participant, PlanView, TravelSource, Venue } from "@/lib/types";
import { fetchJson } from "@/lib/upstream";

/** Minutes by district id, then venue id, plus where they came from. */
type TravelTable = { minutes: Record<string, Record<string, number>>; source: TravelSource };

function log(line: string): void {
  console.log(`${LOG_PREFIX} ${line}`);
}

function estimateTable(districts: DistrictId[], venues: Venue[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const id of districts) {
    const d = getDistrict(id);
    out[id] = {};
    for (const v of venues) out[id][v.id] = estimateMinutes(haversineKm(d, v));
  }
  return out;
}

async function travelTable(districts: DistrictId[], venues: Venue[]): Promise<TravelTable> {
  const key = cacheKey(districts, venues.map((v) => v.id));
  const hit = getCached<TravelTable>(key);
  if (hit) {
    // Logs carry counts only, never which districts a group is in.
    log(`table cache hit districts=${districts.length} source=${hit.source}`);
    return hit;
  }

  const sources = districts.map((id) => getDistrict(id));
  const url = buildTableUrl(OSRM_BASE_URL, { sources, destinations: venues });
  const started = Date.now();
  log(`table requested districts=${districts.length} venues=${venues.length}`);

  let table: TravelTable;
  try {
    const json = await fetchJson(url);
    const parsed = parseTable(json, districts.length, venues.length);
    if (!parsed) throw new Error("unusable table");
    const filled = fillMatrix(parsed, (i, j) => estimateMinutes(haversineKm(sources[i], venues[j])));
    const minutes: Record<string, Record<string, number>> = {};
    districts.forEach((id, i) => {
      minutes[id] = {};
      venues.forEach((v, j) => (minutes[id][v.id] = filled.minutes[i][j]));
    });
    // A matrix with any estimated cell is labelled as an estimate: the screen must not overclaim.
    table = { minutes, source: filled.estimated ? "estimate" : "osrm" };
    log(
      `table ok districts=${districts.length} venues=${venues.length} cells=${districts.length * venues.length} ms=${Date.now() - started}${filled.estimated ? " partial=estimate" : ""}`,
    );
  } catch (err) {
    const reason = isApiError(err) ? err.error : "parse_failure";
    log(`fallback estimate reason=${reason} ms=${Date.now() - started}`);
    table = { minutes: estimateTable(districts, venues), source: "estimate" };
  }

  setCached(key, table);
  return table;
}

export const realAdapter: MesoraAdapter = {
  mode: "real",
  async listGroups() {
    return GROUPS;
  },
  async getGroup(id) {
    return GROUPS.find((g) => g.id === id);
  },
  async listVenues() {
    return VENUES;
  },
  async solve(people: Participant[]): Promise<PlanView> {
    const districts = [...new Set(people.map((p) => p.district))];
    if (!districts.length) return solvePlanWith(people, VENUES, () => 0, "osrm");
    const table = await travelTable(districts, VENUES);
    // estimateTable covers a district the table somehow lacks, so a leg is never undefined.
    const backup = estimateTable(districts, VENUES);
    return solvePlanWith(
      people,
      VENUES,
      (p, v) => table.minutes[p.district]?.[v.id] ?? backup[p.district][v.id],
      table.source,
    );
  },
};
