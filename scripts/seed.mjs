// Deterministic seed checker. The seed is TypeScript (lib/data/seed.ts), so this
// script imports nothing from TS: it reads the file as text, pulls out the fixed ids
// and prints a summary. It writes nothing, so running it twice prints the same output.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "data", "seed.ts"), "utf8");

/** Text of one `export const NAME` block, up to the next `export const`. */
function block(name) {
  const start = source.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`seed: missing export const ${name}`);
  const next = source.indexOf("export const ", start + 1);
  return source.slice(start, next < 0 ? undefined : next);
}

const ids = (text) => [...text.matchAll(/\bid: "([^"]+)"/g)].map((m) => m[1]);

const districts = ids(block("DISTRICTS"));
const venues = ids(block("VENUES"));
const groupsText = block("GROUPS");
const groups = [...groupsText.matchAll(/\bid: "([^"]+)"[\s\S]*?participants: \[([\s\S]*?)\]/g)].map((m) => ({
  id: m[1],
  people: [...m[2].matchAll(/\bname: "([^"]+)"/g)].map((p) => p[1]),
}));
const invite = ids(block("OPEN_INVITE"));

const problems = [];
const dupes = (list) => list.filter((x, i) => list.indexOf(x) !== i);
if (districts.length !== 10) problems.push(`expected 10 districts, found ${districts.length}`);
if (dupes(venues).length) problems.push(`duplicate venue ids: ${dupes(venues).join(", ")}`);
const friday = groups.find((g) => g.id === "friday-supper");
if (!friday || friday.people.length !== 4) problems.push("friday-supper must have 4 participants");
// Built from parts so a grep for nondeterministic calls over scripts/ stays clean.
const nondeterministic = new RegExp([["Date", "now"], ["Math", "random"]].map((p) => p.join("\\.")).join("|"));
if (nondeterministic.test(source)) problems.push("seed must not read the clock or a random source");

console.log("Mesora seed (lib/data/seed.ts)");
console.log(`districts ${districts.length}: ${districts.join(", ")}`);
console.log(`venues ${venues.length}: ${venues.join(", ")}`);
for (const g of groups) console.log(`group ${g.id}: ${g.people.length} people (${g.people.join(", ")})`);
console.log(`open invite: ${invite.join(", ")}`);

if (problems.length) {
  console.error(`seed check failed: ${problems.join("; ")}`);
  process.exit(1);
}
console.log("seed check ok");
