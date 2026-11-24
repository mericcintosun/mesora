// Shared types for Mesora. Every module (seed, solver, codec, adapter, API routes)
// reads its types from here so there is one source and no circular import.
// This file holds no data except DISTRICT_ORDER, the tuple the DistrictId union and
// the link codec's district index are both built from.
import type { ErrorCode } from "./errors";

/** District ids in a fixed order. The codec stores a district as its index here. */
export const DISTRICT_ORDER = [
  "kadikoy",
  "besiktas",
  "bakirkoy",
  "atasehir",
  "uskudar",
  "sisli",
  "fatih",
  "beyoglu",
  "maltepe",
  "sariyer",
] as const;

export type DistrictId = (typeof DISTRICT_ORDER)[number];
export type Side = "Europe" | "Asia";
export type Diet = "any" | "vegetarian" | "vegan";

export interface District {
  id: DistrictId;
  name: string;
  side: Side;
  lat: number;
  lon: number;
}

export interface Venue {
  id: string;
  name: string;
  area: string;
  lat: number;
  lon: number;
  vegetarian: boolean;
  vegan: boolean;
  avgSpendTry: number;
  opens: string;
  closes: string;
  outdoor: boolean;
  /** Transit minutes from each district, in DISTRICT_ORDER. */
  minutes: number[];
}

export interface Participant {
  name: string;
  district: DistrictId;
  diet: Diet;
  budgetTry: number;
  earliest: string;
}

export interface Group {
  id: string;
  title: string;
  city: string;
  dateLabel: string;
  participants: Participant[];
}

/** "seed" while travel minutes come from the cached table, "osrm" once live, "estimate" on fallback. */
export type TravelSource = "seed" | "osrm" | "estimate";

export interface Leg {
  name: string;
  districtName: string;
  minutes: number;
}

export interface Candidate {
  venue: Venue;
  legs: Leg[];
  longest: number;
  total: number;
  excluded: string | null;
}

/** The solved plan as every screen and API response sees it. */
export interface PlanView {
  start: string;
  candidates: Candidate[];
  pick: Candidate | null;
  midpoint: Candidate;
  travelSource: TravelSource;
}

/** Envelope for every JSON API route except /api/parse. */
export type ApiResponse<T> =
  | { ok: true; data: T; source: "fake" | "real" }
  | { ok: false; error: ErrorCode; hint: string };
