// Pure travel-time helpers: no runtime imports, no network, no clock. Node runs this
// file directly with --experimental-strip-types for tests/travel.test.mjs, so it uses
// only erasable TypeScript (type imports, annotations, no enums).
import type { District } from "./types";

export type LatLon = Pick<District, "lat" | "lon">;

/** Road distance is roughly this many times the straight line in Istanbul. */
export const DETOUR_FACTOR = 1.4;
/** Average door to door speed assumed by the estimate. */
export const ESTIMATE_KMH = 25;

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLon, b: LatLon): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Straight-line km times 1.4 at 25 km/h, in whole minutes rounded up. */
export function estimateMinutes(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return 0;
  return Math.ceil(((km * DETOUR_FACTOR) / ESTIMATE_KMH) * 60);
}

export interface TablePoints {
  sources: LatLon[];
  destinations: LatLon[];
}

function coord(p: LatLon): string {
  return `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`;
}

/**
 * One OSRM `table` request: sources first, then destinations, durations only.
 * OSRM wants lon,lat pairs joined by semicolons.
 */
export function buildTableUrl(base: string, points: TablePoints): string {
  const all = [...points.sources, ...points.destinations].map(coord).join(";");
  const src = points.sources.map((_, i) => i).join(";");
  const dst = points.destinations.map((_, i) => i + points.sources.length).join(";");
  return `${base.replace(/\/+$/, "")}/table/v1/driving/${all}?sources=${src}&destinations=${dst}&annotations=duration`;
}

export type MinuteMatrix = (number | null)[][];

/**
 * Reads an OSRM table response. Seconds become whole minutes rounded up and a null
 * cell stays null. Returns null when the response is not usable (code other than
 * "Ok", or a matrix of the wrong size).
 */
export function parseTable(json: unknown, nSources: number, nDest: number): MinuteMatrix | null {
  if (!json || typeof json !== "object") return null;
  const r = json as { code?: unknown; durations?: unknown };
  if (r.code !== "Ok" || !Array.isArray(r.durations)) return null;
  if (r.durations.length !== nSources) return null;
  const out: MinuteMatrix = [];
  for (const row of r.durations) {
    if (!Array.isArray(row) || row.length !== nDest) return null;
    out.push(
      row.map((cell: unknown) => (typeof cell === "number" && Number.isFinite(cell) && cell >= 0 ? Math.ceil(cell / 60) : null)),
    );
  }
  return out;
}

/** A matrix of nulls, so a failed call can go through fillMatrix like any other. */
export function nullMatrix(nSources: number, nDest: number): MinuteMatrix {
  return Array.from({ length: nSources }, () => Array.from({ length: nDest }, () => null));
}

/** Replaces every null cell with fallbackFn(source, destination) and reports whether any cell was estimated. */
export function fillMatrix(
  parsed: MinuteMatrix,
  fallbackFn: (source: number, destination: number) => number,
): { minutes: number[][]; estimated: boolean } {
  let estimated = false;
  const minutes = parsed.map((row, i) =>
    row.map((cell, j) => {
      if (cell === null) {
        estimated = true;
        return fallbackFn(i, j);
      }
      return cell;
    }),
  );
  return { minutes, estimated };
}
