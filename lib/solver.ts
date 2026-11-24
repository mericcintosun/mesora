// Minimax fairness solver. No LLM: given everyone's rough area and limits, it
// picks the venue whose LONGEST trip is shortest, then breaks ties on total minutes.
// It also computes what a plain geographic-midpoint tool would have picked, so
// the plan screen can show the difference.
import { getDistrict } from "@/lib/data";
import { VENUES } from "@/lib/data/seed";
import { DISTRICT_ORDER, type Candidate, type Participant, type PlanView, type TravelSource, type Venue } from "@/lib/types";

/** Minutes from one participant's district to one venue. */
export type MinutesFn = (p: Participant, venue: Venue) => number;

export type { Candidate, Leg } from "@/lib/types";
/** The solver's output; the same shape the adapter and API return as PlanView. */
export type Plan = PlanView;

/** How long the group expects to stay; the venue must be open the whole time. */
export const STAY_MINUTES = 120;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fromMinutes(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/**
 * Seed travel table: cached minutes from a participant's district to a venue.
 * The real adapter passes live OSRM minutes to solvePlanWith instead.
 */
export function travelMinutes(p: Participant, venue: Venue): number {
  return venue.minutes[DISTRICT_ORDER.indexOf(p.district)] ?? 60;
}

function exclusionFor(venue: Venue, people: Participant[], startMin: number): string | null {
  if (people.some((p) => p.diet === "vegan") && !venue.vegan) return "No vegan mains";
  if (people.some((p) => p.diet === "vegetarian") && !venue.vegetarian) return "No vegetarian mains";
  const cap = Math.min(...people.map((p) => p.budgetTry));
  if (venue.avgSpendTry > cap) return `About ${venue.avgSpendTry} TL a head, over the ${cap} TL cap`;
  const opens = toMinutes(venue.opens);
  let closes = toMinutes(venue.closes);
  if (closes <= opens) closes += 1440;
  if (startMin < opens) return `Opens at ${venue.opens}`;
  if (startMin + STAY_MINUTES > closes) return `Closes ${venue.closes}, before ${fromMinutes(startMin + STAY_MINUTES)}`;
  return null;
}

function candidateFor(venue: Venue, people: Participant[], startMin: number, minutesFn: MinutesFn): Candidate {
  const legs = people.map((p) => ({ name: p.name, districtName: getDistrict(p.district).name, minutes: minutesFn(p, venue) }));
  return {
    venue,
    legs,
    longest: legs.length ? Math.max(...legs.map((l) => l.minutes)) : 0,
    total: legs.reduce((s, l) => s + l.minutes, 0),
    excluded: people.length ? exclusionFor(venue, people, startMin) : null,
  };
}

/** What a "meet in the middle" app does: nearest venue to the plain centroid, no filters. */
function midpointVenue(people: Participant[], venues: Venue[]): Venue {
  if (!people.length) return venues[0];
  const pts = people.map((p) => getDistrict(p.district));
  const lat = pts.reduce((s, d) => s + d.lat, 0) / pts.length;
  const lon = pts.reduce((s, d) => s + d.lon, 0) / pts.length;
  const k = Math.cos((lat * Math.PI) / 180);
  return [...venues].sort((a, b) => {
    const da = (a.lat - lat) ** 2 + ((a.lon - lon) * k) ** 2;
    const db = (b.lat - lat) ** 2 + ((b.lon - lon) * k) ** 2;
    return da - db;
  })[0];
}

/** The solver with its travel source injected: the seed table, live OSRM minutes or the estimate. */
export function solvePlanWith(people: Participant[], venues: Venue[], minutesFn: MinutesFn, source: TravelSource): Plan {
  const startMin = people.length ? Math.max(...people.map((p) => toMinutes(p.earliest))) : toMinutes("19:00");
  const candidates = venues
    .map((v) => candidateFor(v, people, startMin, minutesFn))
    .sort((a, b) => {
      if (!!a.excluded !== !!b.excluded) return a.excluded ? 1 : -1;
      return a.longest - b.longest || a.total - b.total;
    });
  const pick = candidates.find((c) => !c.excluded) ?? null;
  const mid = midpointVenue(people, venues);
  const midpoint = candidates.find((c) => c.venue.id === mid.id) ?? candidateFor(mid, people, startMin, minutesFn);
  return { start: fromMinutes(startMin), candidates, pick, midpoint, travelSource: source };
}

/** Seed path, unchanged for client components: the cached table, source "seed". */
export function solvePlan(people: Participant[], venues: Venue[] = VENUES): Plan {
  return solvePlanWith(people, venues, travelMinutes, "seed");
}
