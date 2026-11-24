// Demo reset behind `npm run demo:reset`. Mesora keeps no server state: the group lives
// in the link fragment, the seed lives in lib/data/seed.ts, and lib/cache.ts is only a
// per-instance response cache that expires on its own. There is no store, no database,
// no migration and no chain, so those parts of a reset are a no-op here.
// This script therefore does two things and writes nothing:
//   1. reruns the seed check (scripts/seed.mjs) and exits with its code;
//   2. prints the demo start route and how to clear the browser side.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("Mesora demo reset");
console.log("Server state: none to clear (no store, no database, no migration, no chain).");
console.log("");

const seed = spawnSync(process.execPath, [join(root, "scripts", "seed.mjs")], { cwd: root, stdio: "inherit" });
if (seed.status !== 0) {
  console.error("demo reset: the seed check failed, fix lib/data/seed.ts or fixtures/parse/sample.json first.");
  process.exit(seed.status ?? 1);
}

console.log("");
console.log("Demo start route: /");
console.log("Browser state lives in the tab only (the #g= fragment and the sessionStorage draft).");
console.log("To clear it, open /join/area in a fresh private window.");
console.log("demo reset ok");
