# Mesora

One link for the whole group. Each friend adds their district and limits to it, by sentence or by four short steps, and Mesora picks the venue and time that keeps the longest trip short. The group lives in the link fragment, which never reaches our server.

> Live demo: https://mesora-three.vercel.app

This hackathon (Open Agentic Web Challenge) has no sponsor bounty; Mesora enters the automatic First, Second and Third Prize ranking only (see DELIVERY.md).

## The problem

Getting four to eight friends to agree on a place in a big city takes about 40 messages in the group chat, and the same person always ends up organizing. The "meet in the middle" apps that exist average everyone's coordinates or minimize total distance. That sounds fair and is not: one friend rides 15 minutes, another rides 75. In Istanbul the map centre of Kadıköy, Beşiktaş, Bakırköy and Ataşehir lands on the Üsküdar shore, which is a 74 minute trip from Bakırköy.

They also make everyone hand their location and budget to an organizer or a server.

## The solution

A friend sends you a Mesora link. You open it and type "I'm in Kadıköy, vegetarian, can't leave before 19:00, 400 lira a head max". The agent box turns that into four fields, `website_add_my_constraints` writes them into the link in your browser, and you send it back to the group. When everyone has done the same, the page names a venue and a start time where nobody rides more than about 40 minutes, everyone can eat, and the bill fits the tightest budget.

- **The link is the database.** The group is compressed with lz-string into the URL fragment (after the `#`). Browsers never send the fragment with a request, so our host never sees it. Each person is a first name, a district and the geohash-5 cell (about 5 km) of that district's center, never an address.
- **A solver with no LLM in it.** `website_solve_plan` filters venues by diet, the lowest budget in the group and opening hours for a two hour stay, then picks the venue whose longest trip is shortest (minimax), breaking ties on total minutes.
- **It shows its work.** Every person gets a trip bar for the Mesora pick next to the geographic midpoint, and every rejected venue says why (for example "No vegetarian mains" or "Closes 21:00, before 22:00").

In the seeded Friday supper, the midpoint venue sends Selin on a 74 minute trip. Mesora picks Yenikapı Avlu Mutfak and the longest trip drops to 38.

## How it uses the open agentic web spec

Mesora is an open agentic website under the Cognizant AI Lab spec (github.com/cognizant-ai-labs/agentic-web):

- `public/agent-manifest.json` declares the site, its capabilities, the entry agent and that it is peer callable.
- `public/mesora.network.json` is the agent network: a `front_man` agent plus three site actions.
- Planned, not in the repo yet: the spec browser runtime `public/agentic/runtime.js` (from the agentify-website skill, pinned to the 11 November 2026 spec commit). The manifest already points at it. Until it is vendored, `node build_network.mjs --check` has not been run and Stage One conformance is unproven.
- `website_add_my_constraints`, `website_solve_plan` and `website_get_link` change real page state: the link, the plan and the share URL (`components/agent-bridge.tsx`, registered on `window.mesoraSiteActions`).
- Peer call, simulated: `/about#peer` (`components/peer-call.tsx`) shows an event site's agent asking for consent, then calling `website_solve_plan` with the Friday supper link and getting back the same venue and the same 38 vs 74 minutes. It runs in the same page through `siteActions`, not across origins; the cross-site call needs the vendored runtime.

## Privacy: what leaves the browser

- **Nobody** gets the link fragment after the `#`, where the group lives.
- **Our server** gets the sentence typed in the agent box (`POST /api/parse`, never logged; the parsed four fields are cached in memory for ten minutes, keyed by a sha1 of the sentence). For the two sample groups only, it also solves district, diet, budget and time (`/api/plan`, names dropped).
- **Otari or OpenRouter** get that typed sentence, only when `OTARI_API_KEY` or `OPENROUTER_API_KEY` is set on the deployment. With no key, a rule parser reads it on our server.
- **The public OSRM server** gets district center and venue coordinates (`ADAPTER_MODE=real` only). Never a name, the link or an address.

Type a district, not a street address, in the agent box: whatever you type goes to the parse route.

The new idea here is multi-person coordination: each friend's agent runs in a different browser with a different key, and the only shared state is the link.

## Tech stack

Installed (versions as in `package.json`):

- Next.js ^15.4 (App Router), React ^19.1, TypeScript ^5
- Tailwind CSS ^4.1, with small primitives built on class-variance-authority ^0.7 and @radix-ui/react-slot ^1.1
- GSAP ^3.15 with ScrollTrigger, through @gsap/react ^2.1, for the pinned before/after scene on the home page
- lz-string ^1.5 for the fragment codec, plus a built-in geohash encoder
- zod ^3.25 for request validation at the edge of the JSON routes
- Node's built-in test runner (`node:test`) with type stripping for the travel and codec tests

External service, no package: the OSRM `table` HTTP API (keyless public server by default) for driving minutes.

Not installed and not built: Leaflet, opening_hours.js, ngeohash, an Overpass client, the spec runtime file.

**Seed vs live.** Venues, opening hours, prices, diet flags and the two sample groups are seed data in `lib/data/seed.ts`. The only live data is OSRM driving minutes, and only when `ADAPTER_MODE=real`.

Pages and the JSON routes (`/api/groups`, `/api/groups/[id]`, `/api/plan`) read data through one adapter in `lib/adapter.ts`.

## Real vs sample data

`ADAPTER_MODE` picks the adapter, and `lib/config.ts` is the only file that reads it. `fake`, the default, uses the seeded Istanbul data in `lib/data/seed.ts` with its cached travel table. `real` asks OSRM for driving minutes from each district center to each venue, in one `table` request per solve, cached in memory for ten minutes. If OSRM does not answer within 8 seconds plus one retry, Mesora estimates straight-line km x 1.4 at 25 km/h, sets `travelSource: "estimate"` and the result page says so. In both modes the venues, groups, diet flags, prices and opening hours are still the sample list in `lib/data/seed.ts`, and only district centers go to OSRM, never a name or an exact location. `/result/live` always solves in the browser from the link and calls no API.

`/result/friday-supper` and `/result/sunday-brunch` are solved on the server while the page renders, so the first paint already shows the live minutes and the browser makes no request. Every server solve goes through `solveWithFallback` in `lib/adapter.ts`: if the real adapter throws, the seed table answers and the page says so. `/api/parse` caches each parsed sentence in memory by a sha1 of the normalized text, so the same sentence gets the same answer; when no model answers, the demo sentence gets the committed `fixtures/parse/sample.json` and any other sentence gets the rule parser.

Every failure from `/api/groups/[id]`, `/api/plan` and `/api/parse` has the shape `{ "ok": false, "error": "<code>", "hint": "<one readable line>" }`. The codes are `invalid_input`, `upstream_timeout`, `upstream_error`, `parse_failure` and `not_configured` (`lib/errors.ts`). A successful `/api/plan` answer carries `source` (`fake` or `real`) and `data.travelSource` (`seed`, `osrm` or `estimate`).

## Quickstart

```bash
npm install
cp .env.example .env.local   # optional, every key is optional
npm run seed        # prints the seed summary and checks it, writes nothing
npm run demo:reset  # reruns the seed check and prints the demo start route, writes nothing
npm test            # node:test suite: travel helpers and the idempotent upsert (Node 22.6 or newer)
npm run proof       # live OSRM call, test run and (with PROOF_BASE_URL) the demo path, written into Proof below
npm run dev
```

## Reset

`npm run demo:reset` reruns the seed check and prints the demo start route `/`. There is nothing else to reset, on purpose: the group lives in the link fragment, the seed lives in `lib/data/seed.ts`, and the demo mutates no server state. There is no store, no database, no migration or schema push, and no chain, so those parts of a reset are a no-op. The only server memory is the per-instance response cache in `lib/cache.ts`, which expires on its own after ten minutes. To clear the browser side (the fragment and the step draft), open `/join/area` in a fresh private window.

Set `ADAPTER_MODE=real` in `.env.local` to see live OSRM minutes on `/result/friday-supper`. `OSRM_BASE_URL` can point at a self-hosted OSRM.

Open http://localhost:3000, press "Add yourself to Friday supper" and type the sample sentence, or click through the four steps.

Agent paths, in order: Otari when `OTARI_API_KEY` and `OTARI_BASE_URL` are set, then OpenRouter when `OPENROUTER_API_KEY` is set, then your local `claude` CLI in development, then a deterministic rule parser. The recorded demo must run the Otari or OpenRouter path.

## Proof

`npm run proof` rewrites the three blocks below. The files in `fixtures/osrm/` are hand-written examples of the OSRM table response shape for the unit tests, not recordings of real calls; the live numbers are only the ones in the OSRM block.

### OSRM table call

<!-- PROOF:BEGIN osrm -->
Run on 2026-11-24 against https://router.project-osrm.org (driving profile), one `table` request, latency 275 ms.

| From district center | Harem Sahil Çay Bahçesi | Yenikapı Avlu Mutfak |
| --- | --- | --- |
| Kadıköy | 8 min | 12 min |
| Beşiktaş | 18 min | 13 min |
| Bakırköy | 25 min | 12 min |
| Ataşehir | 14 min | 18 min |
<!-- PROOF:END osrm -->

### Demo path

Three `POST /api/plan` calls of Friday supper in a row against `PROOF_BASE_URL` (set it to the deployed URL). On the seed table the pick's longest trip is 38 min against 74 at the map midpoint; in real mode the minutes are live OSRM.

<!-- PROOF:BEGIN demo-path -->
Not run in this build: PROOF_BASE_URL not set.
<!-- PROOF:END demo-path -->

### Tests

<!-- PROOF:BEGIN tests -->
Run on 2026-11-24 with `node --experimental-strip-types --test tests/*.test.mjs` on Node 22.23.3: 15 passed, 0 failed.
<!-- PROOF:END tests -->

## What we would build next

1. Live venues from Overpass with opening hours parsed by opening_hours.js (trip times already come from OSRM in real mode).
2. A Leaflet map with every friend's cell and the candidate venues, greying out the ones a filter dropped.
3. Move the simulated peer call on `/about#peer` to a real companion event site on its own origin, once the spec runtime is vendored.
4. Publishing the fragment codec and the minimax solver as an npm package so other planners can reuse them.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.
