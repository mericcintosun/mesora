// Proof runner behind `npm run proof`. Plain Node, no TypeScript imports.
// 1. osrm: one real OSRM table call for four seed district centers and two seed venues.
// 2. tests: runs the node:test suite and counts passes and failures.
// It rewrites the matching PROOF blocks in README.md (the only file it writes),
// prints one summary line per proof and always exits 0.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
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

function proveTests() {
  const run = spawnSync(process.execPath, ["--experimental-strip-types", "--test", "--test-reporter=tap", "tests/"], {
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
    text: `Run on ${today()} with \`node --experimental-strip-types --test tests/\` on Node ${process.versions.node}: ${pass[1]} passed, ${fail[1]} failed.`,
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

  const osrmText = osrm.ok ? osrm.text : `Not run in this build: ${osrm.reason}.`;
  const testsText = tests.ok ? tests.text : `Not run in this build: ${tests.reason}.`;

  try {
    let readme = readFileSync(readmePath, "utf8");
    const r1 = replaceBlock(readme, "osrm", osrmText);
    const r2 = replaceBlock(r1.source, "tests", testsText);
    readme = r2.source;
    if (r1.found || r2.found) writeFileSync(readmePath, readme);
    if (!r1.found || !r2.found) console.log("proof: a PROOF marker pair is missing from README.md");
  } catch (err) {
    console.log(`proof: could not update README.md (${oneLine(err?.message ?? err)})`);
  }

  console.log(osrm.ok ? `proof osrm: ok, ${DISTRICTS.length}x${VENUES.length} matrix in ${osrm.ms} ms` : `proof osrm: not run (${osrm.reason})`);
  console.log(tests.ok ? `proof tests: ${tests.pass} passed, ${tests.fail} failed` : `proof tests: not run (${tests.reason})`);
}

main()
  .catch((err) => console.log(`proof: unexpected error (${oneLine(err?.message ?? err)})`))
  .finally(() => {
    process.exitCode = 0;
  });
