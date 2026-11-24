// Unit tests for the pure travel helpers. Run with `npm test`
// (node --experimental-strip-types --test). The fixtures in fixtures/osrm/ are
// hand-written in the OSRM table response shape; they are not recordings.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildTableUrl,
  estimateMinutes,
  fillMatrix,
  haversineKm,
  nullMatrix,
  parseTable,
} from "../lib/travel-core.ts";

const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/osrm/${name}`, import.meta.url), "utf8"));

const CASES = [
  {
    file: "friday-4x2.json",
    n: [4, 2],
    expected: [
      [34, 29],
      [26, 41],
      [61, 20],
      [24, 46],
    ],
  },
  {
    file: "brunch-2x3.json",
    n: [2, 3],
    expected: [
      [35, 15, 55],
      [10, 31, 1],
    ],
  },
  {
    file: "null-cell-2x2.json",
    n: [2, 2],
    expected: [
      [20, null],
      [15, 50],
    ],
  },
  { file: "no-route.json", n: [2, 2], expected: null },
  { file: "same-point-1x1.json", n: [1, 1], expected: [[0]] },
];

for (const c of CASES) {
  test(`parseTable reads ${c.file}`, () => {
    assert.deepEqual(parseTable(fixture(c.file), c.n[0], c.n[1]), c.expected);
  });
}

test("parseTable rejects a matrix of the wrong size", () => {
  assert.equal(parseTable(fixture("friday-4x2.json"), 3, 2), null);
  assert.equal(parseTable(fixture("friday-4x2.json"), 4, 3), null);
  assert.equal(parseTable(null, 1, 1), null);
  assert.equal(parseTable("Ok", 1, 1), null);
});

test("fillMatrix replaces a null cell with the fallback and flags it", () => {
  const parsed = parseTable(fixture("null-cell-2x2.json"), 2, 2);
  assert.ok(parsed);
  const calls = [];
  const { minutes, estimated } = fillMatrix(parsed, (i, j) => {
    calls.push([i, j]);
    return 99;
  });
  assert.deepEqual(minutes, [
    [20, 99],
    [15, 50],
  ]);
  assert.equal(estimated, true);
  assert.deepEqual(calls, [[0, 1]]);
});

test("fillMatrix leaves a complete matrix alone", () => {
  const parsed = parseTable(fixture("brunch-2x3.json"), 2, 3);
  assert.ok(parsed);
  const { minutes, estimated } = fillMatrix(parsed, () => {
    throw new Error("fallback must not run");
  });
  assert.equal(estimated, false);
  assert.deepEqual(minutes, parsed);
});

test("fillMatrix over a null matrix estimates every cell", () => {
  const { minutes, estimated } = fillMatrix(nullMatrix(2, 3), (i, j) => i * 10 + j);
  assert.equal(estimated, true);
  assert.deepEqual(minutes, [
    [0, 1, 2],
    [10, 11, 12],
  ]);
});

test("estimateMinutes is km x 1.4 at 25 km/h and never decreases with distance", () => {
  assert.equal(estimateMinutes(0), 0);
  // 10 km straight line: 14 km of road at 25 km/h is 33.6 minutes, rounded up.
  assert.equal(estimateMinutes(10), 34);
  let prev = -1;
  for (let km = 0; km <= 60; km += 0.25) {
    const m = estimateMinutes(km);
    assert.ok(m >= prev, `estimate dropped at ${km} km`);
    prev = m;
  }
});

test("haversineKm gives a sane Kadıköy to Bakırköy distance", () => {
  const km = haversineKm({ lat: 40.9903, lon: 29.029 }, { lat: 40.9805, lon: 28.8722 });
  assert.ok(km > 12 && km < 14, `got ${km}`);
  assert.equal(haversineKm({ lat: 41, lon: 29 }, { lat: 41, lon: 29 }), 0);
});

test("buildTableUrl puts sources first, then destinations, as lon,lat", () => {
  const url = buildTableUrl("https://router.project-osrm.org/", {
    sources: [
      { lat: 40.9903, lon: 29.029 },
      { lat: 41.0422, lon: 29.0067 },
    ],
    destinations: [{ lat: 41.005, lon: 29.0105 }],
  });
  assert.equal(
    url,
    "https://router.project-osrm.org/table/v1/driving/29.02900,40.99030;29.00670,41.04220;29.01050,41.00500?sources=0;1&destinations=2&annotations=duration",
  );
});
