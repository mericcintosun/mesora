# Mesora

One link for the whole group. Each friend's own agent adds their rough area and limits to it, and Mesora picks the venue and time that keeps the longest trip short. Nobody's location ever reaches a server.

> Live demo: https://mesora.vercel.app

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

Pages and the JSON routes (`/api/groups`, `/api/groups/[id]`, `/api/plan`) read data through one adapter in `lib/adapter.ts`. `ADAPTER_MODE=fake`, the default, uses the seeded Istanbul data in `lib/data/seed.ts`.

## Quickstart

```bash
npm install
cp .env.example .env.local   # optional, every key is optional
npm run seed   # prints the seed summary, writes nothing
npm run dev
```

Open http://localhost:3000, press "Add yourself to Friday supper" and type the sample sentence, or click through the four steps.

Agent paths, in order: Otari when `OTARI_API_KEY` and `OTARI_BASE_URL` are set, then OpenRouter when `OPENROUTER_API_KEY` is set, then your local `claude` CLI in development, then a deterministic rule parser. The recorded demo must run the Otari or OpenRouter path.

## What we would build next

1. Live venues from Overpass and live trip times from OSRM, with a distance estimate labelled "estimated" when OSRM is slow.
2. A Leaflet map with every friend's cell and the candidate venues, greying out the ones a filter dropped.
3. A small companion event site that calls Mesora as a peer and shows the approval card.
4. Publishing the fragment codec and the minimax solver as an npm package so other planners can reuse them.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.
