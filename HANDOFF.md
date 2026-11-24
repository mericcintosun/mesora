# HANDOFF: Mesora

You are picking up a working Next.js 15 scaffold. Read this whole file, then IDENTITY.md, then start on Mission item 1.

## 1. Context

**Product:** Mesora. One link for the whole group: each friend's own agent adds their rough area and limits to it, and the site picks the venue and time that keeps the longest trip short. Location never reaches a server.

**Pitch:** A friend sends you a link. You open it and type "I'm in Kadıköy, vegetarian, can't leave before 19:00, 400 lira a head max", then send the link back to the group. When everyone has done that, the page names a venue and a start time where nobody travels much more than half an hour, everyone can eat, and the bill fits. A map shows how many minutes each person rides. Nobody's home address is visible, only roughly which district they are in.

**Hackathon:** Open Agentic Web Challenge (Cognizant AI Lab, MIT Media Lab NANDA, Mozilla), Devpost: https://cognizant-agenticweb.devpost.com/

**Deadline:** 11 January 2027, 08:00 PT (16:00 UTC). The site must stay free and open until the end of judging (18 January 2027).

**Target:** First Prize ($5,000 + $1,500 Otari credits). Second and Third are the same ranking; one prize per submission. Four criteria, equally weighted: Technological Implementation, Design, Potential Impact, Quality of the Idea. Stage One is pass/fail spec conformance before any scoring.

**Submission requirements (verified from the rules):**
- Public URL of an open agentic website that conforms to the spec at https://github.com/cognizant-ai-labs/agentic-web **as of the start of the submission period (11 November 2026)**. Pin that commit.
- A public, spec-conforming `.json` file describing the agent network and its capabilities.
- A runtime file that runs the agent network in the browser.
- An interface where users or agents interact with the network (a separate LLM and key settings UI is optional).
- The network must interact with the website. Calling or being called by other agentic sites is optional and scores well.
- A text description of features and functionality.
- A public YouTube demo under 2 minutes, project running in the browser, narrated in the entrant's own voice (no AI voice), no unlicensed brands or copyrighted music.
- One or more screenshots of the site.
- If Mozilla Otari is used: the Otari account email, plus one problem met with Otari and an improvement suggestion.
- All materials in English.
- Optional: link community tools or services built along the way (counts toward Potential Impact).
- Code written or substantially updated after 11 November 2026.

## 2. Current state

Identity: see IDENTITY.md (direction D15, structure S3, archetype L1, kit K2)

**Routes (S3 guided flow), all linked from the header nav or the flow itself:**

| Route | File | What it shows |
| --- | --- | --- |
| `/` | `app/page.tsx` | L1 poster hero, CTA into the flow, pinned GSAP before/after scene, folded problem prose |
| `/join/area`, `/join/diet`, `/join/budget`, `/join/time` | `app/join/[step]/page.tsx` + `components/join-flow.tsx` | One question per step, progress indicator, live preview of the table so far, agent sentence box on `area` |
| `/result/friday-supper`, `/result/sunday-brunch`, `/result/live` | `app/result/[id]/page.tsx` + `components/result-view.tsx` | Venue, start time, trip bars vs midpoint, every venue weighed with its rejection reason, share control. `live` decodes the `#g=` fragment |
| `/about` | `app/about/page.tsx` | Method, spec actions, simulated peer call (`#peer`, `components/peer-call.tsx`, Phase 4), models and keys with the third parties named |
| `/api/groups`, `/api/groups/[id]`, `/api/plan`, `/api/parse` | `app/api/...` | JSON routes returning `ApiResponse<T>` (parse: `{ ok, constraints, source }`) through `getAdapter()` and `solveWithFallback` |

Header nav (`components/site-nav.tsx`, rendered by `components/site-header.tsx`): Join the plan, Friday's table, Method, with `aria-current="page"` on the active route group. `/result/live` is reachable from the result page's share row ("Open it as a friend would"). Footer links the two JSON files.

**One-mark proof** (the header home link, verbatim):

```tsx
<Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-full font-[family-name:var(--font-display)] text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  <BrandMark />
  Mesora
</Link>
```

**File map:**
- `lib/types.ts`: every shared type (`District`, `Venue`, `Participant`, `Group`, `Diet`, `Side`, `DistrictId`, `Leg`, `Candidate`, `PlanView`, `ApiResponse<T>`) plus the `DISTRICT_ORDER` tuple the `DistrictId` union is built from.
- `lib/data/seed.ts`: the only home of seed values: 10 Istanbul districts, 10 venues with a cached transit-minute table, groups `friday-supper` (4) and `sunday-brunch` (5), `OPEN_INVITE` (Friday without Deniz), `SAMPLE_SENTENCE`, `TIME_OPTIONS`, `BUDGET_OPTIONS`, `DIET_OPTIONS`. Fixed ids, no clock, no randomness.
- `lib/data.ts`: thin re-export of the types and seed, plus `getGroup` and `getDistrict`. Kept so existing imports work.
- `lib/adapter.ts`: `MesoraAdapter`, `fakeAdapter`, `getAdapter()` (reads `ADAPTER_MODE` from `lib/config.ts`, defaults to `fake`; `real` returns `realAdapter` from `lib/adapter-real.ts`, live OSRM minutes since Phase 2). Server pages (`/`, `/result/[id]`) and `app/api/groups`, `app/api/groups/[id]`, `app/api/plan` read through it.
- `scripts/seed.mjs`: deterministic seed checker behind `npm run seed`.
- `lib/codec.ts`: fragment codec (lz-string), geohash-5 encoder, `upsertParticipant`, 8 person cap. Real.
- `lib/solver.ts`: minimax solver with diet, budget and opening-hours filters plus geographic-midpoint baseline. Real. `solvePlanWith(people, venues, minutesFn, source)` takes the travel source; `solvePlan` uses the seed table (`travelMinutes()`), the real adapter passes OSRM minutes.
- `lib/agent/parse-constraints.ts`: `parseConstraints()` priority chain: Otari, OpenRouter (env or BYOK), local `claude` CLI, rule parser. Real calls when keys are set.
- `app/api/parse/route.ts`: POST endpoint for the sentence parser. Receives the sentence only, never the link. Since Phase 3: zod `parseInputSchema`, `ErrorCode` failures, cached by sentence, fixture fallback.
- `components/ui/states.tsx` (Phase 3): `Skeleton`, `ErrorState` (always a retry), `EmptyState` (always a CTA).
- `lib/participant-key.ts` (Phase 3): `participantKey` and `upsertParticipant`, re-exported by `lib/codec.ts`.
- `components/agent-bridge.tsx`: `siteActions` (`website_add_my_constraints`, `website_solve_plan`, `website_get_link`) registered on `window.mesoraSiteActions`. The join flow's final button calls the same action.
- `components/fairness-scene.tsx`: K2 signature 1 (see below).
- `public/agent-manifest.json`, `public/mesora.network.json`: **hand-written placeholders shaped after the spec.** They are NOT yet validated. Regenerate them with the agentify-website skill.
- `public/logo.svg`, `app/icon.svg`, `public/illustrations/scene-{1,2,3}.svg`, `app/opengraph-image.tsx`: brand pack. `<BrandMark />` and `<SceneSlot />` switch to uploaded PNGs automatically.

**Interaction kit K2 (GSAP):**
- Shipped: **signature 1, the pinned scroll scene** on `/`. The section pins while a scrubbed timeline moves each friend's bar from the midpoint venue (Harem Sahil, longest 74 min) to Mesora's pick (Yenikapı Avlu Mutfak, longest 38 min) and counts the figure down. All values come from `solvePlan(GROUPS[0])`.
- To build: **signature 2**, an intro timeline on first paint: split the home h1 into word spans by hand, stagger them in, then bring in the scene-1 strip. Animate from the visible state so server HTML stays readable.
- To build: **signature 3**, a figure tween bound to a control: on `/result/[id]`, a "Compare with midpoint" toggle that tweens the longest-trip figure and every bar between the two venues.

**Not built yet:** the spec runtime file (`/agentic/runtime.js` is referenced by the manifest but not vendored), the chat panel driven by that runtime, Leaflet map, Overpass and OSRM adapters, Open-Meteo flag, the peer demo site, BYOK key settings UI.

**Note on static export:** the idea mentions static export, but `/api/parse` needs a server. Keep the default Vercel deployment. If you move parsing fully into the browser runtime with BYOK, you can drop the route and export statically.

## 3. Mission (in order)

1. **Spec skeleton and network (3 h, Stage One gate).** Find the spec commit from 11 Nov 2026 and pin it in README. Run the agentify-website skill to generate `agent-manifest.json`, `mesora.network.json`, the browser runtime and the bridge. Wire the generated bridge to `siteActions` in `components/agent-bridge.tsx` (keep the action names). Add a chat panel on `/join/area` (right side, below the question at small widths) where the runtime's `front_man` answers and calls the actions; the participant list in the live preview must update when it does (listen for `mesora:group-changed`, already dispatched). Done when `node build_network.mjs --check` passes and one Otari turn and one OpenRouter turn work. Add a small key settings dialog in `components/ui/` style.
2. **Fragment codec hardening (2 h).** The codec works. Add Node 22 tests for round trip, the 8 person cap and bad input. Show a "link holds N of 8" line in the preview. Done when a second browser window opening the link from step 4 sees the first person's card with district only.
3. **Live solver data (3.5 h).** Replace `travelMinutes()` with an OSRM table adapter (one request per solve, 8 s timeout, fallback haversine km x 1.4 at 25 km/h with `travelSource = "estimate"` and an "estimated" label already wired in the result view). Fetch candidates from Overpass (`amenity=restaurant|cafe`, `diet:vegetarian`, `opening_hours` parsed with opening_hours.js) with a second mirror. Open-Meteo for an outdoor-seating warning. Keep the seed venues as the offline fallback. Done when adding a fourth person recomputes the plan from live data in under 4 s.
4. **Plan view, the wow moment (2 h).** Leaflet map on `/result/[id]` with each person's geohash cell, candidates, and dropped venues greyed. Build K2 signature 3 here: a toggle that tweens the longest-trip figure 74 to 38 with the bars. Rehearse this frame for 1:15 to 1:30 of the video; the numbers must be on screen at the same time as the bars.
5. **Peer composition (1.5 h).** A second tiny agentic page (an event site, separate route or separate Vercel project) whose agent receives a Mesora link, shows an approval card, calls Mesora as a peer with a 10 s timeout and shows the same venue. Add `links.json` per the spec. Run `check_partner.mjs` against the live URL.
6. **Intro timeline (0.5 h).** K2 signature 2 on the home h1.
7. **Deploy and submit (2 h).** Vercel deploy, CORS headers for the JSON files and runtime in `vercel.json`, `--check` against the production URL (paste its output in README), test the keyless path as a judge would, write the Devpost text from README, Otari issue and suggestion note, publish codec and solver to npm, record the video in your own voice, take screenshots.

## 4. Constraints

- Next.js 15 App Router, TypeScript strict, Tailwind v4 (no config file), deploys to Vercel. No custom servers, no filesystem writes at runtime.
- IDENTITY.md is law for every color, font, route, layout and animation. Colors only through tokens in `app/globals.css`; no raw hex in components. Sora on every h1 and h2, Nunito Sans for body. Pill controls, 2px outlines, rounded-3xl panels, one glow per screen (`mesora-glow` or `mesora-glow-text`). Entrance motion only through the `mesora-slide-in` keyframe. Append changes to IDENTITY.md under Amendments only.
- Every GSAP call inside `useGSAP(..., { scope })` and `gsap.matchMedia()`, skipped under reduced motion, never server-render content hidden.
- Use the primitives in `components/ui/`; add new ones there in the same cva form.
- Privacy is the product: never send the fragment, a street address or exact coordinates to any server, including `/api/parse` and analytics.
- Copy: English, no em dashes or double hyphens as dashes, none of the words seamless, leverage, empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless. Write like a person.
- Scope: if something threatens the deadline, cut scope (Open-Meteo, npm package) before polish. Spec conformance and the keyless path are never cut.
- Keep `npm run build` passing after every change.

## 5. Definition of done

- Deployed on Vercel at https://mesora-three.vercel.app, `build_network.mjs --check` passes against it, JSON and runtime reachable with CORS.
- README demo link live; Devpost description, screenshots, Otari note filled.
- The 90 second demo runs end to end: four friends (Kadıköy, Beşiktaş, Bakırköy, Ataşehir), the first types the sample sentence and the agent calls `website_add_my_constraints`; a second window opens the link and sees district-only cards; the fourth person triggers `website_solve_plan`; filtered venues grey out; midpoint 74 min vs Mesora 38 min side by side; an event site's agent calls Mesora as a peer after an approval card and gets the same venue. Closing line: "Nobody gave anyone their address. The decision lives in the link."
- Wow moment rehearsed at least three times with the real deployment.

## 6. Phase 1: walking skeleton and demo path

### Goal

Every DEMO.md step has a route that renders from the seed through one adapter seam, with contracts (DEMO.md, CLAUDE.md), a typed core, API stubs, a deterministic seed and loading, empty and error surfaces.

### Status

All five slices are written. Nothing has been built or run by the agent; `npm run build` and `npm run seed` are the runner's checks and are **unverified**.

### Decisions

- **Seed script:** `scripts/seed.mjs` is a pure checker. It imports nothing from TypeScript and keeps no JSON mirror (a mirror can drift). It reads `lib/data/seed.ts` as text, extracts the ids per `export const` block, prints counts and ids, checks that `friday-supper` has 4 people, and exits 1 on a problem. It writes nothing.
- `DISTRICT_ORDER` lives in `lib/types.ts` because `DistrictId` is derived from it. `lib/data/seed.ts` re-exports it. Import graph: `types` <- `data/seed` <- `data` <- `solver`, `codec` <- `adapter`. No cycle.
- `Plan` in `lib/solver.ts` is now an alias of `PlanView` from `lib/types.ts`; `Leg` and `Candidate` are re-exported, so old imports still work.
- The adapter carries a `mode` field so API responses report `source` truthfully (`fake` even when `ADAPTER_MODE=real`, since real is still a stub).
- `POST /api/plan` keeps only `district`, `diet`, `budgetTry`, `earliest`. Names are replaced with `Person 1..n`, extra fields (coordinates, fragment) are dropped, max 8 people. Bad input gets a 400 `ok: false` body.
- The home page also reads Friday supper and its plan through the adapter (it imported `GROUPS` before).
- Client components (`join-flow`, `result-view`, `agent-bridge`) still call `solvePlan` and read the seed directly. They run in the browser with the fragment, which must not go to a server, so routing them through `/api/plan` would break the privacy rule.
- `app/join/[step]/page.tsx` keeps its own step list: values exported from the `"use client"` `join-flow.tsx` are client references on the server.
- Header nav moved into a small client component `components/site-nav.tsx` (`usePathname`). It scrolls inside itself at 375px instead of pushing the page sideways.
- `app/globals.css` gained named identity tokens (`--ground` ... `--state-bad`, plus `--color-*` aliases), radius, spacing and type scale tokens (`text-display` is now the home h1 size), and a base-layer `:focus-visible` outline. No hex changed. The glow rules use `var(--primary)` instead of a hex.

### Failed attempts

None.

### Files changed

DEMO.md (new), CLAUDE.md (new), .env.example, README.md, HANDOFF.md, package.json, lib/types.ts (new), lib/adapter.ts (new), lib/data/seed.ts (new), lib/data.ts, lib/solver.ts, lib/codec.ts, scripts/seed.mjs (new), app/api/groups/route.ts (new), app/api/groups/[id]/route.ts (new), app/api/plan/route.ts (new), app/page.tsx, app/result/[id]/page.tsx, app/join/[step]/page.tsx, app/about/page.tsx, app/layout.tsx, app/error.tsx, app/not-found.tsx, app/join/loading.tsx (new), app/result/[id]/loading.tsx (new), app/globals.css, app/opengraph-image.tsx, components/site-header.tsx, components/site-nav.tsx (new), components/result-view.tsx, components/join-flow.tsx.

### Commands run

None, the agent cannot run commands; the runner builds.

### Unmet or partly met items (honesty check)

- Build and seed determinism are unverified until the runner runs `npm run build` and `npm run seed` twice.
- The hex Grep over `app/` also matches `app/icon.svg` (lines 2 to 8). It is the brand favicon and on the never-touch list, so it stays. The other matches are `app/globals.css` and the `OG` block in `app/opengraph-image.tsx` (lines 9 to 14), as allowed.
- `/result/live` from the header: there is no header link to it; it is reached from the share row in `components/result-view.tsx` ("Open it as a friend would"), as the spec allows.
- The peer step on `/about` (`app/about/page.tsx`, section `#peer`) is a labelled placeholder, not a working peer call.
- `CLAUDE.md` names the banned words in its writing rules list, so a word Grep over the repo root will match that one line on purpose.
- No tables or `<pre>` blocks exist; the 375px pass fixed the trip bars (`minmax(0,1fr)`, `min-w-0`) and the header nav. Not checked in a real browser.

### Open questions

- Should `POST /api/plan` accept a display name (needed if the Phase 5 peer site wants named legs)? It drops names today.
- `ADAPTER_MODE=real` returns the fake adapter. Phase 2 decides whether `real` should fail loudly or fall back when OSRM or Overpass is down.

### Next best step

Phase 2: run the agentify-website skill to generate the manifest, network JSON, browser runtime and bridge; wire the bridge to `siteActions`; build the real adapter (OSRM table and Overpass, seed as fallback) behind `getAdapter()` with `ADAPTER_MODE=real`; write `.farm-live.json`. (Superseded: Phase 2 took the OSRM part only, see section 7.)

## 7. Phase 2: real travel times behind the adapter

### Goal

`ADAPTER_MODE=real` serves live OSRM driving minutes from district centers to the seed venues through the existing minimax solver, with an honest estimate fallback, zod validation at `/api/plan`, one error taxonomy, and a result page that says in words where its minutes came from.

### Status

All five slices are written. Nothing was built, tested or run by the agent. `npm install`, `npm run build`, `npm test`, `npm run seed` and `npm run proof` are the runner's checks and are **unverified**. The 2 h checkpoint ("`/api/plan` returns live OSRM minutes at least once") can only be confirmed by the runner with `ADAPTER_MODE=real` and network.

**What went real:** travel minutes (OSRM `table`, one request per solve, cached 10 minutes in memory per server instance).
**Still fixtures:** venues, groups, diet flags, budgets, prices and opening hours (`lib/data/seed.ts`); the agent manifest and network JSON placeholders; the peer step on `/about`; the pinned scene on `/` (deliberately stays on the seed table, 74 vs 38).

### Decisions

- **Real mode never fails loudly on an upstream outage.** `lib/upstream.ts` gives OSRM 8 s (`UPSTREAM_TIMEOUT_MS`) plus exactly one retry (`UPSTREAM_RETRIES`). After that, `lib/adapter-real.ts` logs `[core] fallback estimate`, computes haversine km x 1.4 at 25 km/h for every cell, sets `travelSource: "estimate"` and caches that result too. The result page then reads "Estimated: ...". If OSRM answers but leaves some cells null, those cells are estimated and the whole plan is labelled `estimate`, so the screen never overclaims.
- **"Driving minutes":** the public OSRM server only has the car profile, so the source line says "driving minutes between district centers", not transit.
- **Live-fragment privacy rule:** `/result/live` never calls `/api/plan`; it solves in the browser on the seed table, because its group lives in the `#g=` fragment. Seeded groups (`friday-supper`, `sunday-brunch`) POST only `district`, `diet`, `budgetTry` and `earliest`; names are put back in the browser by position (`withNames` in `components/result-view.tsx`). OSRM only ever sees district centroids and seed venue coordinates.
- **Home scene stays seed:** `app/page.tsx` now calls `solvePlan(friday.participants, await adapter.listVenues())` instead of `adapter.solve`, so step 1 of DEMO.md shows the fixed 74 vs 38 in every mode and the static home page makes no network call at build time.
- **Config boundary:** `lib/config.ts` is the only reader of `process.env` (plus `next.config.ts` and the build-time `NEXT_PUBLIC_BRAND_FILES` in `lib/brand-files.ts`). `parse-constraints.ts` imports its Otari, OpenRouter and `VERCEL` values from there, and its LLM call now goes through `fetchJson`, so it also gets the 8 s timeout and one retry (it had 10 s before).
- **Error shape:** `ApiResponse<T>` failure arm is `{ ok: false, error: ErrorCode, hint }`. `/api/groups/[id]` maps "no such group" to `invalid_input` (still HTTP 404). `/api/parse` keeps its own shape.
- **zod schema defaults:** missing `diet`, `budgetTry` or `earliest` default to `any`, 400 and `19:00` as before; a bad `district`, a non-positive budget, a malformed time, 0 or more than 8 people get HTTP 400 `invalid_input`.
- **Cache key** is a sha1 of the sorted unique district ids plus the sorted venue ids; values are stored by id, so input order does not matter. Capped at 200 entries, oldest dropped first.
- **`.farm-live.json`:** `requiredEnv` is empty because OSRM is keyless and the solver is deterministic; `optionalEnv` is `OTARI_API_KEY` and `OPENROUTER_API_KEY`, both read in `lib/config.ts` and listed in `.env.example`.

### Failed attempts

None (nothing could be executed in this session).

### Files changed

New: `lib/config.ts`, `lib/errors.ts`, `lib/schemas.ts`, `lib/cache.ts`, `lib/upstream.ts`, `lib/travel-core.ts`, `lib/adapter-real.ts`, `tests/travel.test.mjs`, `fixtures/osrm/{friday-4x2,brunch-2x3,null-cell-2x2,no-route,same-point-1x1}.json`, `scripts/proof.mjs`, `.farm-live.json`, `.farm-commits.json`.
Edited: `lib/types.ts`, `lib/adapter.ts`, `lib/solver.ts`, `lib/agent/parse-constraints.ts`, `app/api/plan/route.ts`, `app/api/groups/[id]/route.ts`, `app/page.tsx`, `app/about/page.tsx`, `components/result-view.tsx`, `.env.example`, `package.json`, `README.md`, `HANDOFF.md`.

### Commands run

None. The agent cannot run commands.

### Unmet or partly met items (honesty check)

- Build, tests, seed and proof are unverified until the runner runs them.
- `npm test` uses the literal `node --experimental-strip-types --test tests/` from the spec. Node 20 searches a directory argument for test files; on Node 22 and newer the arguments are glob patterns and a bare directory may not match any file. If `npm test` reports 0 tests, change the argument to `tests/*.test.mjs` (in `package.json` and in `scripts/proof.mjs`). Type stripping needs Node 22.6 or newer.
- "Every fetch call site uses `UPSTREAM_TIMEOUT_MS` and `UPSTREAM_RETRIES`": true for every server call (`lib/upstream.ts`, used by `lib/adapter-real.ts` and `lib/agent/parse-constraints.ts`). The two browser calls to our own routes (`/api/parse` in `components/join-flow.tsx`, `/api/plan` in `components/result-view.tsx`) cannot import `lib/config.ts` (it reads `process.env` and must stay server only); `/api/plan` from the browser has its own 20 s abort. `scripts/proof.mjs` uses its own 8 s timeout and no retry, since it is a plain Node script.
- The source line and the warn note sit inside the "Trip per person" card, which only renders when a venue fits everyone. A group with no fitting venue shows no source line. (Fixed in Phase 3: both now sit under the hero, see section 8.)
- During the first moments on `/result/friday-supper` in real mode the page shows the seed plan and the "Sample data" line until `/api/plan` answers; then it switches to the live plan. (Fixed in Phase 3: the page is solved on the server, see section 8.)
- The memory cache is per serverless instance, so "stable across two reloads" holds when both reloads hit the same warm instance. OSRM itself is deterministic for the same input, so a cold instance should return the same minutes unless the public server's map data changed.
- The hex Grep over `app/` still matches `app/icon.svg` (never-touch brand file), `app/globals.css` and the `OG` block in `app/opengraph-image.tsx`, as in Phase 1. None of the files changed in this phase has a hex literal.

### Manual checklist (needs a person)

- Confirm the OSRM public server's usage terms (fair use, no heavy traffic) before the judging period, and consider a self-hosted OSRM URL in `OSRM_BASE_URL`.
- After `npm run proof`, read the OSRM block in README and check the minutes look plausible for Istanbul.
- On the deployed `/result/friday-supper` with `ADAPTER_MODE=real`, check the line reads "Live source" and reload twice.

### Open questions

- Should a partly estimated matrix (some null cells) get its own wording? Today it is labelled the same as a full estimate.
- Should `/api/plan` accept a display name for the Phase 5 peer site? It still drops names.

### Next best step

Phase 3: generate the spec manifest, network JSON, browser runtime and bridge with the agentify-website skill and wire them to `siteActions` (the Stage One gate). Then live venues from Overpass with opening_hours.js, keeping the seed as fallback behind the same adapter, and the "Compare with midpoint" toggle (K2 signature 3) on the now live numbers. (Superseded: Phase 3 took the demo path hardening instead, see section 8. Runtime vendoring is on its manual checklist.)

## 8. Phase 3: demo path on the real flow

### Goal

DEMO.md steps 1 to 6 run through the real adapter with a named fallback in the same file, survive an upstream failure, and show a named Skeleton, ErrorState and EmptyState on every demo route. `/result/friday-supper` shows live OSRM minutes on first paint, with no seed flash and no client fetch.

### Status

All five slices are written. Nothing was built, tested or run by the agent. `npm run build`, `npm test`, `npm run seed`, `npm run demo:reset` and `npm run proof` are the runner's checks and are **unverified**. No slice was cut.

### Decisions

**Store row.** Decision-table row 1, "Steps only read seeded or computed data". The group lives in the URL fragment (`lib/codec.ts`), the seed lives in `lib/data/seed.ts`, and the demo mutates no server state. There is no `lib/store.ts` because there is nothing to store: a store would only ever hold group state, and the product promise is that no server holds group state. `lib/cache.ts` stays the only server memory; it is a per-instance response cache with a 10 minute TTL and a 200 entry cap, not persistence.

Rejected rows:
- KV store: would force a server to hold the group, which breaks the privacy claim that the link is the database.
- Postgres: the same problem plus a migration and a connection to keep alive during judging, for data that already lives in the link.
- On-chain: no contracts exist, no wallet, and a public ledger is the opposite of "nobody sees your area".

**Fallback ledger (DEMO steps 1 to 6).** Every fallback below is code in the named file, not a comment.

| Step | Route | Real code path (file) | Fallback symbol (same file) |
| --- | --- | --- | --- |
| 1 | `/` | `app/page.tsx`: `getAdapter()` then `solvePlan(friday.participants, await adapter.listVenues())` (the pinned scene stays on the seed table by design, 74 vs 38) | `app/page.tsx`: `?? (await adapter.listGroups())[0]` when `friday-supper` is missing, and `pick ? <FairnessScene .../> : null`; render errors go to `app/error.tsx` (`ErrorState` with `reset`) |
| 2 | `/join/area` | `components/join-flow.tsx`: `askAgent` POSTs to `/api/parse`, which calls `parseConstraints` in `lib/agent/parse-constraints.ts` | `components/join-flow.tsx`: the `ErrorState` branch (`agentState.status === "error"`) with Retry and "Use the steps instead"; `lib/agent/parse-constraints.ts`: `fallbackParse` (fixture for the sample sentence, rule parser otherwise) |
| 3 | `/join/diet`, `/join/budget`, `/join/time` | `components/join-flow.tsx`: `update()` plus `solvePlan(people)` in the browser | `components/join-flow.tsx`: the group defaults to `OPEN_INVITE` and `sync()` only replaces it when `groupFromHash` decodes (`if (g) setGroup(g)`); `EmptyState` when nobody is in the table |
| 4 | `/result/friday-supper` | `app/result/[id]/page.tsx`: `solveWithFallback(adapter, group.participants)` on the server, real adapter in `lib/adapter-real.ts` | `lib/adapter.ts`: `solveWithFallback` catch returns `fakeAdapter.solve(people)` and logs `[core] fallback seed reason=...`; `lib/adapter-real.ts`: `estimateTable` (`[core] fallback estimate`); `app/result/[id]/page.tsx`: `try/catch` sets `served = null`, and `components/result-view.tsx` renders `ErrorState` with `retryPlan` |
| 5 | `/result/live` | `components/result-view.tsx`: one effect decodes `groupFromHash(window.location.hash)`, `useMemo` calls `solvePlan` in the browser | `components/result-view.tsx`: `EmptyState` ("Nobody is in this link yet", CTA `/join/area`) when the fragment is missing or empty; `EmptyState` ("No table fits everyone", CTA `/join/budget`) when no venue fits |
| 6 | `/about` | `app/about/page.tsx`: static seed constants, no request | `app/about/page.tsx`: `EmptyState` "No peer yet" in `#peer`, CTA `/join/area`; render errors go to `app/error.tsx` |

**Result route choice.** `app/result/[id]/page.tsx` had `generateStaticParams`, which prerenders the seeded ids at build time and would make one OSRM call per id during `next build` in real mode. It was removed and replaced by `export const dynamic = "force-dynamic"`, so no network call happens at build time and every request solves once (cached 10 minutes per instance). `app/result/[id]/loading.tsx` streams its `Skeleton` while the solve runs.

**Two-level label.** `ServedPlan` (`lib/adapter.ts`) carries `plan`, `source` (the adapter that actually answered) and `fellBack`. `components/result-view.tsx` maps that to five source lines: `live`, `estimate` (OSRM failed inside the real adapter), `fallback` (the real adapter threw), `sample` (fake mode) and `fragment`. `/api/plan` returns `ok: true` with `source: "fake"` after a fallback; only invalid input gets `ok: false`.

**Idempotency.** Key: `participantKey(name)` (NFC, trimmed, inner whitespace collapsed, lowercased). Write: `upsertParticipant`. Both live in `lib/participant-key.ts`, which has no path aliases so `node:test` can load it, and are re-exported and named in `lib/codec.ts` (line 104 and the comment above it). The old key was `name.toLowerCase()` without a trim, so " Deniz" and "Deniz" were two rows; fixed. `website_add_my_constraints` in `components/agent-bridge.tsx` and the join flow's final button both go through it. Test: `tests/codec.test.mjs`.

**Pending binding.** `parsePending` is bound to `disabled` on "Let my agent fill it" (`components/join-flow.tsx` line 248). It is set true before the fetch and false in `finally`; the 20 s timeout only aborts the fetch. On the last step, `pending` (`submitPending || navPending`) is bound to `disabled` on "Add me to the link" (line 323). `submitPending` resets in `finally`. The write itself is synchronous (it rewrites the fragment), so the window it guards is short; `navPending` from `useTransition` keeps the button disabled during the route change to `/result/live`.

**Cache and fixture.** `/api/parse` validates `{ text, byok? }` with `parseInputSchema` (`lib/schemas.ts`: trimmed, 1 to 280 characters) and returns `invalid_input` on failure. It looks up `sentenceKey(text)` (`lib/cache.ts`: `parse:` plus sha1 of `normalizeSentence`) before calling a provider and stores every answer, so the same sentence gets the same answer for 10 minutes per instance. On provider failure or timeout, `parseConstraints` returns `fallbackParse(text)`: the committed `fixtures/parse/sample.json` (statically imported, Kadıköy, vegetarian, 19:00, 400) when the text is `SAMPLE_SENTENCE`, the rule parser otherwise. The response shape is identical; the join flow renders the same green badge and only the "Read by" note changes. The BYOK key is never cached or logged; the sentence is never logged.

**Performance.** `/result/friday-supper` in real mode waits on at most one OSRM `table` request on a cold cache (8 s timeout plus one retry, then the estimate). Its estimate table and the seed table are already precomputed in `lib/data/seed.ts` and `lib/adapter-real.ts`, so no step needs more precomputing. `components/result-view.tsx` has one `useEffect` (fragment decode, line 90) and the only `fetch` is in `retryPlan` (line 107), which runs from the ErrorState button. `SceneSlot` and `BrandMark` now use `next/image`; SVG files render with `unoptimized`, uploaded PNGs are optimized. No `<img` is left in `app/` or `components/`.

**States per route.**

| Route | Skeleton | ErrorState (retry) | EmptyState (CTA) |
| --- | --- | --- | --- |
| `/` | `app/loading.tsx` | `app/error.tsx` (`reset`) | the page renders from seed constants and has no empty case; the empty branch for the site is `/about` `#peer` |
| `/join/[step]` | `app/join/loading.tsx` | `components/join-flow.tsx`: parse failure or timeout, Retry plus "Use the steps instead" to `/join/diet` | `components/join-flow.tsx`: live preview with nobody in the table, CTA "Type the sample sentence" |
| `/result/[id]` | `app/result/[id]/loading.tsx`, plus `Skeleton` in `result-view.tsx` while the fragment is read | `components/result-view.tsx`: server solve failed or retry failed, Retry calls `retryPlan` | `components/result-view.tsx`: empty fragment (CTA `/join/area`) and no fit (CTA `/join/budget`) |
| `/about` | `app/loading.tsx` | `app/error.tsx` (`reset`) | `app/about/page.tsx`: "No peer yet" in `#peer`, CTA `/join/area` |

**Tests command.** `npm test` now runs `tests/*.test.mjs` (the README proof showed `tests/` failing on Node 22, as section 7 predicted). `scripts/proof.mjs` lists the same files with `readdirSync`, because `spawnSync` has no shell to expand the glob.

**Manifest honesty.** `public/agent-manifest.json` and `public/mesora.network.json` were read and checked against `siteActions`: the three action names and the parameters `name`, `district`, `diet`, `budget_try`, `earliest` match, and the district enum matches `DISTRICT_ORDER`. No JSON change was needed. They are still hand-written placeholders, not validated by `build_network.mjs --check`.

### Failed attempts

None (nothing could be executed in this session).

### Files changed

New: `components/ui/states.tsx`, `app/loading.tsx`, `lib/participant-key.ts`, `tests/codec.test.mjs`, `fixtures/parse/sample.json`, `scripts/demo-reset.mjs`, `.farm-commits.json` (not committed).
Edited: `lib/adapter.ts`, `app/api/plan/route.ts`, `app/result/[id]/page.tsx`, `components/result-view.tsx`, `app/join/loading.tsx`, `app/result/[id]/loading.tsx`, `app/error.tsx`, `app/about/page.tsx`, `components/join-flow.tsx`, `components/agent-bridge.tsx`, `lib/codec.ts`, `lib/schemas.ts`, `lib/cache.ts`, `lib/agent/parse-constraints.ts`, `app/api/parse/route.ts`, `components/scene-slot.tsx`, `components/brand-mark.tsx`, `scripts/seed.mjs`, `scripts/proof.mjs`, `package.json`, `README.md`, `.env.example`, `HANDOFF.md`.
Unchanged on purpose: `.farm-live.json` (still `requiredEnv: []`, `optionalEnv: ["OTARI_API_KEY", "OPENROUTER_API_KEY"]`; `PROOF_BASE_URL` is proof only), `public/agent-manifest.json`, `public/mesora.network.json`.

### Commands run

None. The agent cannot run commands.

### Unmet or partly met items (honesty check)

- Build, tests, seed, demo reset and proof are unverified until the runner runs them. The README `demo-path` block says "Not run in this build: PROOF_BASE_URL not set." until `npm run proof` runs with the variable set.
- "Live source on first paint" for `/result/friday-supper` holds only with `ADAPTER_MODE=real` on the deployment and OSRM answering; with the default `fake` the line reads "Sample data", which is honest but not the demo line.
- Step 1 (`/`) is deliberately not on live minutes: the pinned scene keeps the seed 74 vs 38 so the story frame never changes. Its "fallback" is the `?? listGroups()[0]` group fallback and the `pick ? ... : null` guard, which are thin.
- `app/loading.tsx` shows a rounded panel during a slow transition to `/`; L1 bans cards in the first viewport of the finished page, and the skeleton is only visible before the page arrives.
- The last step's write is synchronous, so `submitPending` alone is true for one tick; the double click guard that matters is the idempotent `upsertParticipant` plus `navPending`.
- The `/api/plan` retry after a fallback cannot tell a fallback from fake mode (the API has no `fellBack` field), so after a retry it reads "Sample data" rather than "the live engine failed".
- The parse cache is per serverless instance; two cold instances may each call the provider once for the same sentence. A provider can also answer a sentence differently on two cold instances; the 10 minute cache only pins the answer per instance.
- The spec runtime file `/agentic/runtime.js` is still not in the repo (see the manual checklist).
- Not checked in a real browser or at 375px.

### Open questions

- Should the `/api/plan` envelope carry `fellBack` so a retry can keep the "live engine failed" wording?
- Should the no-key path also use the fixture for the sample sentence (it does now), or should only a provider failure do that?

### Next best step

Phase 4: Overpass venues with opening_hours.js behind the same adapter (seed venues as the fallback inside `solveWithFallback`), the Leaflet map on `/result/[id]`, and K2 signature 3 ("Compare with midpoint") on the live numbers. Before that, a person runs the Stage One checklist below.

### Manual checklist (needs a person)

1. OSRM terms: confirm the public OSRM server's usage policy before judging (18 January 2027), or set `OSRM_BASE_URL` to a self-hosted OSRM.
2. Stage One runtime vendoring. **The runtime file is still not in the repo.**
   1. Open https://github.com/cognizant-ai-labs/agentic-web, find the last commit on or before 11 November 2026, and pin its hash in README under "How it uses the open agentic web spec".
   2. Run the agentify-website skill at that commit to vendor `public/agentic/runtime.js` and the bridge, and wire the bridge to `siteActions` in `components/agent-bridge.tsx` (keep the three action names).
   3. Deploy, then run `node build_network.mjs --check` against the deployed URL and paste its output in README.
3. Three-cycle walk: in a private window on the live URL with `ADAPTER_MODE=real`, walk DEMO.md steps 1 to 6 three times. Expect identical results, no step over 5 seconds, "Live source" on `/result/friday-supper` and no "Sample data" flash.
4. Failure walk: set a bad `OSRM_BASE_URL` (or block OSRM) once and open `/result/friday-supper`. Expect the page to render with the "Estimated" line.
5. Run `PROOF_BASE_URL=<deployed url> npm run proof` and check the `demo-path` block shows three identical answers and no call over 5 seconds.

## 9. Phase 4: peer call, delivery sheet, responsive pass, privacy and hygiene

### Goal

DEMO.md gains step 7 (an event site's agent asks for consent, calls `website_solve_plan` and gets the same Friday supper plan, 38 vs 74 min), the site works at 360, 768 and 1280 px, DELIVERY.md and SECURITY.md exist, metadata points at the live host, and every privacy sentence says what the code actually sends.

### Status

All seven slices are written. Nothing was built, tested or run by the agent; `npm run build`, `npm test` and `npm run proof` are the runner's checks and are **unverified**. No slice was cut. Slices 1 to 3 (peer call, nav disclosure, DELIVERY.md) were written earlier in this phase's session and were checked against the spec by reading, not rewritten.

### Decisions

- **No sponsor bounty.** `targetTracks` holds only automatic placements (First, Second, Third, Employee Prize). Zero bounty integration rows were added and zero were dropped; README says so in one sentence under the live link, and DELIVERY.md line 6 repeats it.
- **Peer call is in-page and labelled Simulated.** `components/peer-call.tsx` builds the Friday supper link in the browser (`hashFor` on the seed group, line 40) and calls `siteActions.website_solve_plan({ link })` (line 48), the same solver and seed table as `/result/live`. It does not go through `/api/plan`: the link fragment must stay in the browser, and `website_solve_plan` already decodes it there. No new infrastructure. The 10 s timeout is a `Promise.race` (lines 20 and 65 to 69).
- **metadataBase** comes from `SITE_URL` in `lib/config.ts` (`NEXT_PUBLIC_SITE_URL`, fallback `https://mesora-three.vercel.app`), so `lib/config.ts` stays the one env reader for app code. The OG and Twitter images come from the file convention `app/opengraph-image.tsx`, which Next merges into `openGraph.images` and `twitter.images` for every route, so `images` is not repeated in the object (repeating it would emit a second og:image tag).
- **Privacy findings (slice 6), from the code:**
  - The `#g=` fragment is never sent: `/result/live` and the peer call decode it in the browser (`components/agent-bridge.tsx` line 51, `components/result-view.tsx` line 93).
  - The typed sentence is POSTed to `/api/parse` (`components/join-flow.tsx` line 141) and forwarded to Otari or OpenRouter when `OTARI_API_KEY` plus `OTARI_BASE_URL`, or `OPENROUTER_API_KEY`, is set (`lib/agent/parse-constraints.ts` lines 165 to 171). It is not logged; the parsed four fields are cached ten minutes by sha1 of the sentence (`app/api/parse/route.ts` lines 36 to 50). A visitor could type a street address into it, so the copy now says "name a district, not a street".
  - OSRM gets district centroids and seed venue coordinates (`lib/adapter-real.ts` lines 42 to 43, `lib/travel-core.ts` `buildTableUrl`), never names or the fragment.
  - The link holds a first name, district, the geohash-5 of the **district centroid** (`lib/codec.ts` line 14 and 58), diet, budget and time. The old home copy said "rounds your spot to a 5 km geohash cell"; there is no "spot", so it was rewritten.
  - One-line fix applied: `lib/adapter-real.ts` logged the district ids and venue ids of every OSRM table call (`table ok districts=kadikoy,...`), against its own comment "Logs carry counts only". It now logs counts.
  - Rewritten copy: home hero and "Why your address stays home" (`app/page.tsx`), footer (`app/layout.tsx`), `/about` "Your agent, your browser, your key", spec paragraph and "Models and keys" with a four-line list naming our server, Otari or OpenRouter, the OSRM public server and "Nobody: the link fragment" (`app/about/page.tsx`), the agent box description (`components/join-flow.tsx`), README "Privacy: what leaves the browser", OG claim line (`app/opengraph-image.tsx` line 39, text only), `public/agent-manifest.json` `privacy` and `url` (was `mesora.vercel.app`).
- **Stack honesty.** README and `/about` no longer say the spec runtime runs in the browser or that the visitor's own key is used (the join flow sends no BYOK key). README lists versions from `package.json` and names Leaflet, opening_hours.js, ngeohash, Overpass client and the runtime as not installed or built.
- **Footer Source link** to the repo, `target="_blank"` with `rel="noopener noreferrer"` (`app/layout.tsx` lines 62 to 68).

### Contract front and wallet greps (slice 5)

Contract front skipped, no `contracts/` (Glob `contracts/**`: no files); wallet rules verify vacuously. Grep over `app/`, `components/`, `lib/` for `eth_requestAccounts|eth_sign|personal_sign|ethereum|wagmi|viem|ethers`: no matches. `SECURITY.md` written with the four sections.

### Hygiene sweep (slice 7), greps and results

- `sk-|PRIVATE_KEY|otk_[A-Za-z0-9]|[0-9a-f]{64}|[A-Za-z0-9+/]{80,}` in `app/ components/ lib/ public/` (ts, tsx, css, json, js): no matches.
- `OTARI_API_KEY`, `OPENROUTER_API_KEY` are read only in `lib/config.ts` (lines 21 and 24) and used in `lib/agent/parse-constraints.ts`; no `"use client"` file imports either (`"use client"` files: `app/error.tsx`, `components/agent-bridge.tsx`, `fairness-scene.tsx`, `join-flow.tsx`, `peer-call.tsx`, `result-view.tsx`, `site-nav.tsx`). `NEXT_PUBLIC_` values: `NEXT_PUBLIC_BRAND_FILES` (file names) and `NEXT_PUBLIC_SITE_URL` (the public URL), both public.
- `target="_blank"`: one, the new footer Source link, with `rel="noopener noreferrer"`.
- `http://` in `app/ components/ lib/ public/`: only SVG `xmlns` strings (`app/icon.svg`, `public/logo.svg`, `public/illustrations/scene-*.svg`). `OSRM_BASE_URL` default is https (`lib/config.ts` line 11).
- `fetch(`: browser calls only to `/api/parse` (`components/join-flow.tsx` line 141) and `/api/plan` (`components/result-view.tsx` line 119); server calls only in `lib/upstream.ts` (OSRM, Otari, OpenRouter, all named on `/about`). No `<form>` element exists.
- `process.env` reads: `ADAPTER_MODE`, `OSRM_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `OTARI_API_KEY`, `OTARI_BASE_URL`, `OTARI_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `VERCEL` (`lib/config.ts`) and `NEXT_PUBLIC_BRAND_FILES` (`lib/brand-files.ts`); all ten are in `.env.example`. `useSearchParams`: none. `fs.write`: none. Edge runtime: none (`app/api/parse/route.ts` is `nodejs`).
- `console.log` in `app/` and `components/`: none. Server-only `[core]` logs remain in `lib/adapter.ts`, `lib/adapter-real.ts`, `lib/agent/parse-constraints.ts` (counts and reason codes only).
- `.farm-live.json` unchanged: `requiredEnv: []`, `optionalEnv: ["OTARI_API_KEY", "OPENROUTER_API_KEY"]`.

### Sameness tripwire (greps and results)

- Dead hexes (0b0f14 ... f59e0b) in `app/ components/ lib/`: covered by the next grep, no match.
- `#[0-9a-fA-F]{6}` in `app/ components/ lib/` (ts, tsx, css, json, js): only `app/globals.css` lines 8 to 41 and the `OG` block `app/opengraph-image.tsx` lines 10 to 13. `app/icon.svg` also has hexes (never-touch brand file).
- `@keyframes`: only `mesora-slide-in` (`app/globals.css` line 132). No `fade-up`, `float`, `glow-pulse`, `caret-blink`, `pulse-dot`.
- `backdrop-blur`, `--delay`, `--d:`: none. Header is solid `bg-background` (`components/site-header.tsx` line 7), one `BrandMark` inside the brand link.
- Animation libraries in `package.json`: only `gsap` and `@gsap/react`.
- Em dash, en dash, ` -- ` in app, components, lib, public JSON, README, DEMO, DELIVERY, HANDOFF: none.
- Banned vocabulary: one match, HANDOFF.md line 99, the rule that lists the words.

### Failed attempts

None.

### Files changed

New: `components/peer-call.tsx`, `DELIVERY.md`, `SECURITY.md`.
Edited: `app/about/page.tsx`, `DEMO.md`, `components/site-nav.tsx`, `components/ui/button.tsx`, `components/join-flow.tsx`, `components/result-view.tsx`, `components/fairness-scene.tsx`, `components/agent-bridge.tsx`, `app/page.tsx`, `app/layout.tsx`, `app/opengraph-image.tsx` (text only), `lib/config.ts`, `lib/adapter-real.ts`, `public/agent-manifest.json`, `.env.example`, `README.md`, `HANDOFF.md`.
Untouched on purpose: `app/icon.svg`, `public/*.svg`, `fixtures/`, `.farm-live.json`, `lib/data/seed.ts` (74 vs 38 unchanged).

### Commands run

None. The agent cannot run commands. (One empty `true` shell call was issued by mistake; it did nothing.)

### Unmet or partly met items (honesty check)

- Build, tests and proof are unverified until the runner runs them.
- The peer call is not cross-site: it runs in the same page through `siteActions` and says "Simulated" (`components/peer-call.tsx` lines 93 and 97). `links.json` and `check_partner.mjs` from Mission item 5 are not done.
- `public/agentic/runtime.js` is still missing; the manifest's `runtime` field points at a 404. `build_network.mjs --check` has never run.
- Responsive behavior was checked by reading classes only, never in a browser at 360, 768 or 1280 px. The mobile nav panel is `absolute` under the sticky header (`components/site-nav.tsx` line 68), which relies on the header being a positioned element (it is `sticky`).
- `app/join/[step]` keeps its live preview as a side column at lg (`components/join-flow.tsx` line 218). L1 bans side columns on the home route only, so this was left.
- `app/layout.tsx` description is about 140 characters by hand count, not measured.
- The `/about` "Callable by other agentic sites" card still describes the intended cross-site capability; the section below it is the simulated version and is labelled.

### Open questions

- Should the agent box refuse or strip street-like text before POSTing to `/api/parse`? Today the copy warns; the code sends what is typed.
- Should the manifest drop its `runtime` field until the file exists, so a validator does not hit a 404?

### Next best step

Phase 5: the frontend pass (K2 signatures 2 and 3: intro timeline on the home h1, "Compare with midpoint" tween on `/result/[id]`). Real Overpass venues, the Leaflet map and runtime vendoring stay on the manual checklist above.

## 10. Phase 5: frontend pass, scene, submission files

### Goal

DEMO.md step 1 through the result page look like a funded product on a cold open: L1 poster home with no card in the first viewport, all three K2 signatures (pinned scene, headline intro, "Compare with midpoint" 38 to 74 tween), five or six scene slots, and the README, SUBMISSION.md and screenshot list ready for the form.

### Status

All five slices are written; no slice was cut (scene-6 kept). Nothing was built, tested or run by the agent. `npm run build`, `npm test` and `npm run proof` are the runner's checks and are **unverified**. The delta contract with diagnosis, changes, proof counts, route, slot and interaction maps is in the repo-root delta file (not committed).

### Decisions

- **Pinned scene on phones.** The before shots show a 1,100 px empty band after the scene (pin spacer of `+=900`) and a squeezed bar column at 390 px. The pin now runs only at `(min-width: 768px)` with `end: "+=520"`; below 768 px the same timeline scrubs from `top 70%` to `bottom 60%` without a pin (`components/fairness-scene.tsx` lines 75 to 83). The bars sit between two LINE rules instead of a grey card, and phone rows stack the name above a full-width bar.
- **No opacity dimming.** The venue pills no longer tween to opacity 0.35. A `data-phase` attribute on the section (set by the ScrollTrigger `onUpdate`) switches which pill is lit through `group-data-[phase=...]` classes. With JS off neither class applies and both pills show full.
- **Intro timeline** (`components/hero-intro.tsx`): the h1 holds an `sr-only` span with the full headline and an `aria-hidden` span of word spans (`data-hero-word`). GSAP `from` tweens (x -24, autoAlpha 0, `expo.out`, 0.55 s, which is the M2 curve) run after hydration inside `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)`; server HTML is fully visible.
- **Compare tween** (`TripCompare` in `components/result-view.tsx`): one `gsap.to` on `{ t }` with `onUpdate` paints the figure and every bar from `plan.pick.legs` to `plan.midpoint.legs`. The handler is wrapped in `contextSafe` from `useGSAP`; reduced motion is detected by a `gsap.matchMedia()` inside `useGSAP` and makes the switch instant. React renders the pick values and never rewrites the tweened nodes because their props never change. The bars and figure turn violet in compare mode through a `data-compare` attribute. The old second violet bar per row ("N min at midpoint") is gone; the toggle replaces it.
- **Ghost button** is now a LINE outlined pill (`border-line`, hover acid) so the secondary CTA reads as a control, not floating text (before-mobile-fold shot).
- **Footer**: one sentence plus Method, Source repo, the Devpost page and the two JSON files.
- **Home fold panels**: one visible sentence in each `<summary>`, details folded; the privacy facts (parse route, Otari or OpenRouter, OSRM) stay inside the second panel.
- **Glow count** per screen: `/` the CTA (`app/page.tsx`), `/join/time` the final button, `/result/[id]` the h1 text glow, `/about` the bottom CTA. One each.
- **AI-use quote.** The spec asked to quote "narration in the demo video must be the entrant's own; no rule on AI tools in code" and also to keep the word "video" out of README and SUBMISSION.md. README quotes "no rule on AI tools in code" verbatim and paraphrases the narration rule without that word.
- **CLAUDE.md says never touch `public/illustrations/`**; this phase's spec explicitly asked to extend scene 1 to 3 and add 4 to 6, so the phase spec won. scene-1 lost its SURFACE slab, scene-2 became 720x640 (near square), scene-3 became 1440x480 (wide); the minutes drawn in scene-3 (20, 35, 30, 38) are the seed legs at Yenikapı Avlu Mutfak.
- **LICENSE** added (MIT, "The Mesora authors"); README names it.

### SVG fallbacks

Glob `public/brand/*` found no files, so every slot renders its SVG fallback: scene-1 (`/`), scene-2 (`/join/[step]`, from sm up), scene-3 (`/result/[id]`), scene-4 (`/result/live` empty state), scene-5 (`/about`), scene-6 (not-found).

### Failed attempts

None.

### Files changed

New: `components/hero-intro.tsx`, `public/illustrations/scene-4.svg`, `scene-5.svg`, `scene-6.svg`, `SUBMISSION.md`, `docs/SCREENSHOTS.md`, `LICENSE`, `.farm-commits.json` (not committed), the delta file (not committed).
Edited: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/not-found.tsx`, `app/about/page.tsx`, `app/result/[id]/page.tsx`, `components/fairness-scene.tsx`, `components/result-view.tsx`, `components/join-flow.tsx`, `components/site-nav.tsx`, `components/ui/button.tsx`, `components/ui/states.tsx`, `public/illustrations/scene-1.svg`, `scene-2.svg`, `scene-3.svg`, `README.md`, `HANDOFF.md`.
Untouched on purpose: `lib/data/seed.ts` (74 vs 38 unchanged), `app/icon.svg`, `public/__farm.txt`, `.farm-live.json`, `fixtures/`, `components/brand-mark.tsx`, `components/site-header.tsx`, `components/peer-call.tsx`, IDENTITY.md (no decision changed, no amendment).

### Commands run

None, the agent cannot run commands.

### Unmet or partly met items (honesty check)

- Build, types, tests and proof are unverified. Type risks worth a look if the build fails: `ScrollTrigger.Vars` as a parameter type (`components/fairness-scene.tsx` line 47), and `contextSafe` returned by `useGSAP` (`components/result-view.tsx` line 101).
- Never seen in a browser: the pinned scene at 768 px with a short viewport may still be taller than the screen while pinned; the intro may show a brief flash, because the server HTML is visible and GSAP sets the `from` state after hydration (by design, so JS-off stays readable).
- scene-2 is `hidden` below `sm` (`components/join-flow.tsx`, the SceneSlot after the preview card) to keep the phone step short.
- `/result/live` also shows the "Want another table?" strip with scene-3 under its result or empty state.
- `.mesora-enter` and `.mesora-stagger` still use the CSS keyframe with `both` fill, which starts at opacity 0 for 550 ms; it runs without JS, so content is never stuck hidden, but it is CSS-hidden for the first frames.
- The join flow keeps its preview as a side column at lg (allowed: the L1 ban is for the home route).
- The SUBMISSION.md Otari note describes the `/api/v1` base URL pitfall recorded in CLAUDE.md; the builder should confirm it matches what they actually met.

### Open questions

- Is Otari configured on the deployment? If not, drop the Otari note and the `mozilla-otari` tag from SUBMISSION.md.
- Should scene-2 show on phones too?

### Next best step

Runner: `npm install`, `npm run build`, `npm test`, `npm run proof`, then the screenshot pass in `docs/SCREENSHOTS.md` compared against the before shots. Phases 6 and 7 apply the judge findings, then freeze.

### Manual submit checklist (needs a person)

1. Pin the 11 November 2026 spec commit of https://github.com/cognizant-ai-labs/agentic-web in README.
2. Vendor `public/agentic/runtime.js` with the agentify-website skill and run `node build_network.mjs --check` against the deployed URL; paste the output in README.
3. Decide on the manifest `runtime` field: drop it until the file exists, or keep it once vendored.
4. Set the Otari account email in the Devpost form (left out of SUBMISSION.md on purpose).
5. Record the demo in your own voice, under 2 minutes, public on YouTube, and paste the link into the form yourself (left out of SUBMISSION.md and README on purpose).
6. Take the screenshots in `docs/SCREENSHOTS.md` and upload them.
7. Run Lighthouse on `/` and `/result/friday-supper` (performance and accessibility at 80 or above).
8. Confirm the site stays free and open through 18 January 2027.
