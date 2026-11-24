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
| `/about` | `app/about/page.tsx` | Method, spec actions, models and keys |

Header nav (`components/site-header.tsx`): Join the plan, Friday's table, Method. Footer links the two JSON files.

**One-mark proof** (the header home link, verbatim):

```tsx
<Link href="/" className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
  <BrandMark />
  Mesora
</Link>
```

**File map:**
- `lib/data.ts`: types plus seed: 10 Istanbul districts, 10 venues with a cached transit-minute table, groups `friday-supper` (4) and `sunday-brunch` (5), `OPEN_INVITE` (Friday without Deniz).
- `lib/codec.ts`: fragment codec (lz-string), geohash-5 encoder, `upsertParticipant`, 8 person cap. Real.
- `lib/solver.ts`: minimax solver with diet, budget and opening-hours filters plus geographic-midpoint baseline. Real. **Mock:** `travelMinutes()` reads the seed table; swap for OSRM.
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
