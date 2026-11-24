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
| `/about` | `app/about/page.tsx` | Method, spec actions, peer call placeholder (`#peer`, labelled stub until mission item 5), models and keys |
| `/api/groups`, `/api/groups/[id]`, `/api/plan` | `app/api/...` | JSON stubs returning `ApiResponse<T>` through `getAdapter()` |

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
- `app/api/parse/route.ts`: POST endpoint for the sentence parser. Receives the sentence only, never the link.
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

- Deployed on Vercel at https://mesora.vercel.app, `build_network.mjs --check` passes against it, JSON and runtime reachable with CORS.
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
- The source line and the warn note sit inside the "Trip per person" card, which only renders when a venue fits everyone. A group with no fitting venue shows no source line.
- During the first moments on `/result/friday-supper` in real mode the page shows the seed plan and the "Sample data" line until `/api/plan` answers; then it switches to the live plan.
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

Phase 3: generate the spec manifest, network JSON, browser runtime and bridge with the agentify-website skill and wire them to `siteActions` (the Stage One gate). Then live venues from Overpass with opening_hours.js, keeping the seed as fallback behind the same adapter, and the "Compare with midpoint" toggle (K2 signature 3) on the now live numbers.
