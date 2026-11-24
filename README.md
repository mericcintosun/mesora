# Mesora

One link for the whole group. Each friend's own agent adds their rough area and limits to it, and Mesora picks the venue and time that keeps the longest trip short. Nobody's location ever reaches a server.

> Live demo: https://mesora-three.vercel.app

## The problem

Getting four to eight friends to agree on a place in a big city takes about 40 messages in the group chat, and the same person always ends up organizing. The "meet in the middle" apps that exist average everyone's coordinates or minimize total distance. That sounds fair and is not: one friend rides 15 minutes, another rides 75. In Istanbul the map centre of Kadıköy, Beşiktaş, Bakırköy and Ataşehir lands on the Üsküdar shore, which is a 74 minute trip from Bakırköy.

They also make everyone hand their location and budget to an organizer or a server.

## The solution

A friend sends you a Mesora link. You open it and say "I'm in Kadıköy, vegetarian, can't leave before 19:00, 400 lira a head max". Your agent, running in your browser with your key, writes that into the link and you send it back to the group. When everyone has done the same, the page names a venue and a start time where nobody rides more than about 40 minutes, everyone can eat, and the bill fits the tightest budget.

- **The link is the database.** The group is compressed with lz-string into the URL fragment (after the `#`). Browsers never send the fragment with a request, so our host never sees it. Locations are cut down to a district and a geohash-5 cell (about 5 km).
- **A solver with no LLM in it.** `website_solve_plan` filters venues by diet, the lowest budget in the group and opening hours for a two hour stay, then picks the venue whose longest trip is shortest (minimax), breaking ties on total minutes.
- **It shows its work.** Every person gets a trip bar for the Mesora pick next to the geographic midpoint, and every rejected venue says why (for example "No vegetarian mains" or "Closes 21:00, before 22:00").

In the seeded Friday supper, the midpoint venue sends Selin on a 74 minute trip. Mesora picks Yenikapı Avlu Mutfak and the longest trip drops to 38.

## How it uses the open agentic web spec

Mesora is an open agentic website under the Cognizant AI Lab spec (github.com/cognizant-ai-labs/agentic-web):

- `public/agent-manifest.json` declares the site, its capabilities, the entry agent and that it is peer callable.
- `public/mesora.network.json` is the agent network: a `front_man` agent plus three site actions.
- The browser runtime (from the agentify-website skill) runs the network in the visitor's tab with the visitor's own key.
- `website_add_my_constraints`, `website_solve_plan` and `website_get_link` change real page state: the link, the plan and the share URL (`components/agent-bridge.tsx`).
- Because the network is peer callable, another agentic site (an event page, a restaurant) can hand Mesora a group link and get back the fairest venue and time after its visitor approves.

The new idea here is multi-person coordination: each friend's agent runs in a different browser with a different key, and the only shared state is the link.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4, with small primitives built on class-variance-authority and Radix Slot
- GSAP 3 with ScrollTrigger (through @gsap/react) for the pinned before/after scene on the home page
- lz-string for the fragment codec, plus a built-in geohash encoder
- zod for request validation at the edge of the JSON routes
- OSRM `table` service (the keyless public server by default) for driving minutes
- Node's built-in test runner (`node:test`) with type stripping for the travel tests

Pages and the JSON routes (`/api/groups`, `/api/groups/[id]`, `/api/plan`) read data through one adapter in `lib/adapter.ts`.

## Real vs sample data

`ADAPTER_MODE` picks the adapter, and `lib/config.ts` is the only file that reads it. `fake`, the default, uses the seeded Istanbul data in `lib/data/seed.ts` with its cached travel table. `real` asks OSRM for driving minutes from each district center to each venue, in one `table` request per solve, cached in memory for ten minutes. If OSRM does not answer within 8 seconds plus one retry, Mesora estimates straight-line km x 1.4 at 25 km/h, sets `travelSource: "estimate"` and the result page says so. In both modes the venues, groups, diet flags, prices and opening hours are still the sample list in `lib/data/seed.ts`, and only district centers go to OSRM, never a name or an exact location. `/result/live` always solves in the browser from the link and calls no API.

Every failure from `/api/groups/[id]` and `/api/plan` has the shape `{ "ok": false, "error": "<code>", "hint": "<one readable line>" }`. The codes are `invalid_input`, `upstream_timeout`, `upstream_error`, `parse_failure` and `not_configured` (`lib/errors.ts`). A successful `/api/plan` answer carries `source` (`fake` or `real`) and `data.travelSource` (`seed`, `osrm` or `estimate`).

## Quickstart

```bash
npm install
cp .env.example .env.local   # optional, every key is optional
npm run seed   # prints the seed summary, writes nothing
npm test       # node:test suite for the travel helpers (Node 22.6 or newer)
npm run proof  # one live OSRM call plus the test run, written into the Proof section below
npm run dev
```

Set `ADAPTER_MODE=real` in `.env.local` to see live OSRM minutes on `/result/friday-supper`. `OSRM_BASE_URL` can point at a self-hosted OSRM.

Open http://localhost:3000, press "Add yourself to Friday supper" and type the sample sentence, or click through the four steps.

Agent paths, in order: Otari when `OTARI_API_KEY` and `OTARI_BASE_URL` are set, then OpenRouter when `OPENROUTER_API_KEY` is set, then your local `claude` CLI in development, then a deterministic rule parser. The recorded demo must run the Otari or OpenRouter path.

## Proof

`npm run proof` rewrites the two blocks below. The files in `fixtures/osrm/` are hand-written examples of the OSRM table response shape for the unit tests, not recordings of real calls; the live numbers are only the ones in the OSRM block.

### OSRM table call

<!-- PROOF:BEGIN osrm -->
Run on 2026-11-24 against https://router.project-osrm.org (driving profile), one `table` request, latency 292 ms.

| From district center | Harem Sahil Çay Bahçesi | Yenikapı Avlu Mutfak |
| --- | --- | --- |
| Kadıköy | 8 min | 12 min |
| Beşiktaş | 18 min | 13 min |
| Bakırköy | 25 min | 12 min |
| Ataşehir | 14 min | 18 min |
<!-- PROOF:END osrm -->

### Tests

<!-- PROOF:BEGIN tests -->
Run on 2026-11-24 with `node --experimental-strip-types --test tests/` on Node 22.23.3: 0 passed, 1 failed.
<!-- PROOF:END tests -->

## What we would build next

1. Live venues from Overpass with opening hours parsed by opening_hours.js (trip times already come from OSRM in real mode).
2. A Leaflet map with every friend's cell and the candidate venues, greying out the ones a filter dropped.
3. A small companion event site that calls Mesora as a peer and shows the approval card.
4. Publishing the fragment codec and the minimax solver as an npm package so other planners can reuse them.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.
