# Devpost submission text: Mesora

Fields in the order of the Devpost form. Character limits are noted where the form has one; counts are by hand and approximate.

## Project name

Mesora

## Elevator pitch (tagline, limit 200 characters)

One link for the whole group: each friend adds a district and limits, and Mesora picks the table where the longest trip is shortest. No server sees who is coming.

(about 160 characters)

## About the project (text description of features and functionality)

### What it does

Mesora picks a dinner table for four to eight friends. A friend sends a Mesora link; each person opens it, adds a district, diet, budget per head and earliest start time, by typing one sentence for the agent or by four short steps, and sends the link on. The page then names a venue and a start time where the longest trip is as short as possible, everyone can eat, and the bill fits the tightest budget.

### Features you can see in the demo

- **The fairness scene on the home page.** As you scroll, four friends' trip bars move from the geographic midpoint (Harem Sahil Çay Bahçesi, longest trip 74 min) to Mesora's pick (Yenikapı Avlu Mutfak, longest trip 38 min).
- **A guided join flow.** `/join/area`, `/join/diet`, `/join/budget`, `/join/time`, one question per step, a persistent progress row, and a live preview of the table so far. Back and forward keep your input.
- **An agent box.** Type "I'm in Kadıköy, vegetarian, can't leave before 19:00, 400 lira a head max" and the site action `website_add_my_constraints` fills all four fields.
- **The result page.** `/result/friday-supper` names the venue and start time, and "Compare with midpoint" tweens the longest-trip figure and every bar between 38 and 74 minutes. Every venue Mesora weighed is listed, and the ones it dropped say why (diet, budget or opening hours).
- **The link is the database.** The group is compressed into the URL fragment after the `#`, which browsers never send to a server. `/result/live` decodes it in your browser and shows district-only cards.
- **A peer call, simulated.** On `/about#peer`, an event site's agent asks for consent, calls Mesora's `website_solve_plan` with the Friday supper link and gets the same table back. It runs in the same page and is labelled "Simulated".

### How it works

The solver is plain code with no LLM in it: it keeps venues that feed everyone, fit the lowest budget and stay open two hours past the start, then picks the one whose longest trip is shortest (minimax). The only model call turns one typed sentence into four fields, through Mozilla Otari or OpenRouter when a key is set, or a rule parser otherwise. With `ADAPTER_MODE=real`, trip minutes come from the public OSRM table API between district centers; the result page says in one line whether it shows "Sample data" or a "Live source".

### What is real and what is sample

Venues, prices, opening hours and the two sample groups are seed data. The peer call is simulated in the page. The spec browser runtime file is not in the repo yet, so the cross-site call and the `build_network.mjs --check` run are still to do.

## Built with

next.js, react, typescript, tailwindcss, gsap, lz-string, zod, osrm, mozilla-otari, openrouter, vercel

## Try it out links

- Live: https://mesora-three.vercel.app
- Source: https://github.com/mericcintosun/mesora

## Otari note (problem met and one improvement)

- **Problem met:** the Otari base URL has to end in `/api/v1` for an OpenAI-compatible client. It is easy to copy only the bare host, and then every call fails before a model answers, so Mesora's docs and `.env.example` now say "ends in /api/v1".
- **Suggestion:** show the full OpenAI-compatible base URL, `/api/v1` included, next to the key in the dashboard with a copy button, and answer a request that misses the suffix with a JSON hint naming the right path.

## Code freshness

All code in this repository was written after 11 November 2026, the start of the submission period.

## Prize track

| Track | Prize | Credits |
| --- | --- | --- |
| First Prize | $5,000 USD | $1,500 USD Otari credits |
