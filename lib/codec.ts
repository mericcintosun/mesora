// URL fragment codec: the whole group lives in `#g=...` after the link.
// The fragment is never sent to a server with the HTTP request, so nobody's
// rough location or budget leaves the browsers that hold the link.
import LZString from "lz-string";
import { getDistrict } from "@/lib/data";
import { MAX_PEOPLE, participantKey, upsertParticipant } from "@/lib/participant-key";
import { DISTRICT_ORDER, type Diet, type DistrictId, type Group, type Participant } from "@/lib/types";

export { MAX_PEOPLE };

/** Compact wire shape: short keys keep the link short enough for chat apps. */
interface WireParticipant {
  n: string; // name
  h: string; // geohash-5 of the district centroid (about 5 km cell)
  d: number; // district index in DISTRICT_ORDER
  f: 0 | 1 | 2; // diet: any, vegetarian, vegan
  b: number; // budget per head, TRY
  t: string; // earliest start, HH:MM
}
interface WireState {
  v: 1;
  title: string;
  p: WireParticipant[];
}

const DIETS: Diet[] = ["any", "vegetarian", "vegan"];
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Standard geohash encoding. Precision 5 is roughly a 4.9 km by 4.9 km cell. */
export function geohash(lat: number, lon: number, precision = 5): string {
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180;
  let hash = "";
  let bit = 0;
  let ch = 0;
  let even = true;
  while (hash.length < precision) {
    if (even) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) { ch = (ch << 1) | 1; lonMin = mid; } else { ch = ch << 1; lonMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { ch = (ch << 1) | 1; latMin = mid; } else { ch = ch << 1; latMax = mid; }
    }
    even = !even;
    if (++bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

function toWire(p: Participant): WireParticipant {
  const d = getDistrict(p.district);
  return {
    n: p.name.slice(0, 24),
    h: geohash(d.lat, d.lon, 5),
    d: DISTRICT_ORDER.indexOf(p.district),
    f: DIETS.indexOf(p.diet) as 0 | 1 | 2,
    b: Math.round(p.budgetTry),
    t: p.earliest,
  };
}

function fromWire(w: WireParticipant): Participant | null {
  const district = DISTRICT_ORDER[w.d] as DistrictId | undefined;
  if (!district) return null;
  return { name: w.n, district, diet: DIETS[w.f] ?? "any", budgetTry: w.b, earliest: w.t };
}

export function encodeGroup(title: string, participants: Participant[]): string {
  const state: WireState = { v: 1, title, p: participants.slice(0, MAX_PEOPLE).map(toWire) };
  return LZString.compressToEncodedURIComponent(JSON.stringify(state));
}

export function decodeGroup(payload: string): Pick<Group, "title" | "participants"> | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    const state = JSON.parse(json) as WireState;
    if (state.v !== 1 || !Array.isArray(state.p)) return null;
    const participants = state.p.map(fromWire).filter((p): p is Participant => p !== null);
    return { title: state.title, participants };
  } catch {
    return null;
  }
}

/** Reads `#g=` from a hash string such as window.location.hash. */
export function groupFromHash(hash: string): Pick<Group, "title" | "participants"> | null {
  const match = hash.match(/[#&]g=([^&]+)/);
  return match ? decodeGroup(match[1]) : null;
}

export function hashFor(title: string, participants: Participant[]): string {
  return `#g=${encodeGroup(title, participants)}`;
}

// Write path. Idempotency key: participantKey(name), the NFC-normalized, trimmed,
// whitespace-collapsed, lowercased name (lib/participant-key.ts). upsertParticipant
// replaces the row with the same key, so a double click or a retry never duplicates a
// person. The join flow and the website_add_my_constraints action both call it.
export { participantKey, upsertParticipant };
