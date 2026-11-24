// Proof runner behind `npm run proof`. Plain Node, no TypeScript imports.
// 1. osrm: one real OSRM table call for four seed district centers and two seed venues.
// 2. tests: runs the node:test suite and counts passes and failures.
// 3. demo-path: when PROOF_BASE_URL is set, POSTs Friday supper to /api/plan three
//    times and records whether the answers match, the longest trips, the travel source
//    and each latency. Otherwise it records that it did not run.
// It rewrites the matching PROOF blocks in README.md (the only file it writes),
// prints one summary line per proof and always exits 0.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(root, "README.md");

const OSRM_BASE = "https://router.project-osrm.org";
const TIMEOUT_MS = 8000;

// Copied from lib/data/seed.ts (DISTRICTS and VENUES). District centers only.
const DISTRICTS = [
  { name: "Kadıköy", lat: 40.9903, lon: 29.029 },
  { name: "Beşiktaş", lat: 41.0422, lon: 29.0067 },
  { name: "Bakırköy", lat: 40.9805, lon: 28.8722 },
  { name: "Ataşehir", lat: 40.9923, lon: 29.1244 },
];
const VENUES = [
  { name: "Harem Sahil Çay Bahçesi", lat: 41.005, lon: 29.0105 },
  { name: "Yenikapı Avlu Mutfak", lat: 41.0037, lon: 28.951 },
];

const today = () => new Date().toISOString().slice(0, 10);
const oneLine = (s) => String(s).replace(/\s+/g, " ").trim().slice(0, 160);

async function proveOsrm() {
  const coords = [...DISTRICTS, ...VENUES].map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  const sources = DISTRICTS.map((_, i) => i).join(";");
  const destinations = VENUES.map((_, i) => i + DISTRICTS.length).join(";");
  const url = `${OSRM_BASE}/table/v1/driving/${coords}?sources=${sources}&destinations=${destinations}&annotations=duration`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const ms = Math.round(performance.now() - started);
    if (!res.ok) return { ok: false, reason: `OSRM answered HTTP ${res.status}` };
    const json = await res.json();
    if (json.code !== "Ok" || !Array.isArray(json.durations)) return { ok: false, reason: `OSRM code ${oneLine(json.code)}` };
    const rows = DISTRICTS.map((d, i) => {
      const cells = VENUES.map((v, j) => {
        const sec = json.durations[i]?.[j];
        return `${typeof sec === "number" ? Math.ceil(sec / 60) : "no route"}${typeof sec === "number" ? " min" : ""}`;
      });
      return `| ${d.name} | ${cells.join(" | ")} |`;
    });
    const lines = [
      `Run on ${today()} against ${OSRM_BASE} (driving profile), one \`table\` request, latency ${ms} ms.`,
      "",
      `| From district center | ${VENUES.map((v) => v.name).join(" | ")} |`,
      `| --- | ${VENUES.map(() => "---").join(" | ")} |`,
      ...rows,
    ];
    return { ok: true, ms, text: lines.join("\n") };
  } catch (err) {
    const reason = controller.signal.aborted ? `no answer within ${TIMEOUT_MS} ms` : oneLine(err?.message ?? err);
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

/** tests/*.test.mjs, listed here because spawnSync runs without a shell to expand the glob. */
function testFiles() {
  return readdirSync(join(root, "tests"))
    .filter((f) => f.endsWith(".test.mjs"))
    .sort()
    .map((f) => join("tests", f));
}

/** Friday supper as POST /api/plan takes it: district, diet, budget and earliest only. */
const FRIDAY = [
  { district: "besiktas", diet: "any", budgetTry: 600, earliest: "19:30" },
  { district: "bakirkoy", diet: "any", budgetTry: 450, earliest: "19:00" },
  { district: "atasehir", diet: "any", budgetTry: 500, earliest: "20:00" },
  { district: "kadikoy", diet: "vegetarian", budgetTry: 400, earliest: "19:00" },
];
const DEMO_CALLS = 3;
const DEMO_TIMEOUT_MS = 20_000;

/** demo-path: three POST /api/plan calls in a row against PROOF_BASE_URL. */
async function proveDemoPath() {
  const base = (process.env.PROOF_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) return { ok: false, reason: "PROOF_BASE_URL not set" };
  const calls = [];
  for (let i = 0; i < DEMO_CALLS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEMO_TIMEOUT_MS);
    const started = performance.now();
    try {
      const res = await fetch(`${base}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: FRIDAY }),
        signal: controller.signal,
      });
      const ms = Math.round(performance.now() - started);
      const body = await res.json();
      if (!body?.ok) return { ok: false, reason: `call ${i + 1} answered ${oneLine(body?.error ?? `HTTP ${res.status}`)}` };
      calls.push({ ms, body });
    } catch (err) {
      const reason = controller.signal.aborted ? `call ${i + 1} had no answer within ${DEMO_TIMEOUT_MS} ms` : oneLine(err?.message ?? err);
      return { ok: false, reason };
    } finally {
      clearTimeout(timer);
    }
  }
  const same = calls.every((c) => JSON.stringify(c.body.data) === JSON.stringify(calls[0].body.data));
  const first = calls[0].body;
  const pick = first.data.pick;
  const lines = [
    `Run on ${today()} against ${base}/api/plan, ${DEMO_CALLS} identical POSTs of Friday supper (district, diet, budget and earliest only).`,
    "",
    `- Answers identical: ${same ? "yes" : "no"}`,
    `- Pick: ${pick ? `${pick.venue.name}, longest trip ${pick.longest} min` : "no venue fits"}`,
    `- Map midpoint: ${first.data.midpoint.venue.name}, longest trip ${first.data.midpoint.longest} min`,
    `- Adapter: ${first.source}, travelSource: ${first.data.travelSource}`,
    `- Latency per call: ${calls.map((c) => `${c.ms} ms`).join(", ")}`,
  ];
  return { ok: true, same, ms: calls.map((c) => c.ms), text: lines.join("\n") };
}

function proveTests() {
  const run = spawnSync(process.execPath, ["--experimental-strip-types", "--test", "--test-reporter=tap", ...testFiles()], {
    cwd: root,
    encoding: "utf8",
    timeout: 90_000,
  });
  if (run.error) return { ok: false, reason: oneLine(run.error.message) };
  const out = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
  const pass = out.match(/^# pass (\d+)/m);
  const fail = out.match(/^# fail (\d+)/m);
  if (!pass || !fail) return { ok: false, reason: `no test summary in the output (exit code ${run.status})` };
  return {
    ok: true,
    pass: Number(pass[1]),
    fail: Number(fail[1]),
    text: `Run on ${today()} with \`node --experimental-strip-types --test tests/*.test.mjs\` on Node ${process.versions.node}: ${pass[1]} passed, ${fail[1]} failed.`,
  };
}

function replaceBlock(source, name, body) {
  const begin = `<!-- PROOF:BEGIN ${name} -->`;
  const end = `<!-- PROOF:END ${name} -->`;
  const a = source.indexOf(begin);
  const b = source.indexOf(end);
  if (a < 0 || b < a) return { source, found: false };
  return { source: `${source.slice(0, a + begin.length)}\n${body}\n${source.slice(b)}`, found: true };
}

async function main() {
  const osrm = await proveOsrm();
  const tests = proveTests();
  const demo = await proveDemoPath();

  const osrmText = osrm.ok ? osrm.text : `Not run in this build: ${osrm.reason}.`;
  const testsText = tests.ok ? tests.text : `Not run in this build: ${tests.reason}.`;
  const demoText = demo.ok ? demo.text : `Not run in this build: ${demo.reason}.`;

  try {
    let readme = readFileSync(readmePath, "utf8");
    const results = [];
    for (const [name, body] of [
      ["osrm", osrmText],
      ["tests", testsText],
      ["demo-path", demoText],
    ]) {
      const r = replaceBlock(readme, name, body);
      readme = r.source;
      results.push([name, r.found]);
    }
    if (results.some(([, found]) => found)) writeFileSync(readmePath, readme);
    for (const [name, found] of results) if (!found) console.log(`proof: the PROOF marker pair for ${name} is missing from README.md`);
  } catch (err) {
    console.log(`proof: could not update README.md (${oneLine(err?.message ?? err)})`);
  }

  console.log(osrm.ok ? `proof osrm: ok, ${DISTRICTS.length}x${VENUES.length} matrix in ${osrm.ms} ms` : `proof osrm: not run (${osrm.reason})`);
  console.log(tests.ok ? `proof tests: ${tests.pass} passed, ${tests.fail} failed` : `proof tests: not run (${tests.reason})`);
  console.log(
    demo.ok ? `proof demo-path: identical=${demo.same ? "yes" : "no"}, latency ${demo.ms.join("/")} ms` : `proof demo-path: not run (${demo.reason})`,
  );
}

main()
  .catch((err) => console.log(`proof: unexpected error (${oneLine(err?.message ?? err)})`))
  .finally(() => {
    process.exitCode = 0;
  });
