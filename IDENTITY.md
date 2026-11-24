# IDENTITY (contract; every later phase obeys this file)

DIRECTION: D15 neon
GROUND: #121010 warm-black
SURFACE: #1b1717
DEEP: #262020
LINE: #3a3030
INK: #f6f1ec
ACCENT: #e8ff3a acid-yellow
ON_ACCENT: #121010
SECOND: #9b5cff violet
OK: #69a56f
WARN: #e0b84e
BAD: #ef6a5a
FONT_DISPLAY: F15 Sora (next/font/google: Sora)
FONT_BODY: Nunito Sans (next/font/google: Nunito_Sans)
FONT_MONO: none
STRUCTURE: S3 guided-flow
ARCHETYPE: L1 poster
MOTION: M2 slide, prefix mesora-
KIT: K2 gsap
RADIUS: round
HEADER: solid ground, border-b in LINE, sticky
LOGO_POLICY: brand-mark

## Why

The farm assigned this identity so that no two projects share a look, a route map or an interaction style. The most recent projects it differs from: Relate by Neo4j Hackathon (D20, S4, L6, K5); Build with CMC: API Hackathon (Plushie) (D2, S6, L5, K6). It is not a suggestion. Tie the product's own nouns to it; do not swap any row for a familiar one.

## Direction: D15 neon

Warm black night with outlined neon signs.

Surface treatment: 2px accent outlines like neon tubes, a glow (box-shadow or text-shadow in the accent) on exactly one element per screen, pill-shaped controls, large rounded panels.

Every hex in app/globals.css comes from the key block above. RADIUS round means 0.75rem and above on every card, panel and control. ON_ACCENT is the text color on an ACCENT fill. The semantic colors (OK, WARN, BAD) mark state only, never brand.

## Structure: S3 guided-flow

The core loop is a 3 to 5 step guided flow; each step is its own URL.

Route map (name the bracketed parts with the product's own words):
- `/` : the start screen, with the claim and step 1 embedded or one tap away
- `/<flow>/[step]` : one route per step, named from the domain (for example `/check/route`, `/check/fare`)
- `/result/[id]` : the outcome as a summary page with a share control
- `/about` : method and sponsor tech

Rules:
- a persistent progress indicator shows the steps and the current one
- browser back and forward move between steps without losing input (state in the URL or sessionStorage)
- each step asks for one thing and shows a live preview of the outcome so far

## Archetype: L1 poster (the composition of the home route)

Full-bleed typographic hero: the display headline spans the full container at clamp(3.5rem, 9vw, 8rem), the CTA row sits beneath it, and the product appears only below the fold as one full-width live frame.

MUSTs: the headline is the largest element on screen; CTA inside the first viewport; the product frame is full-width.
Bans: any card in the first viewport; any side column at lg.

## Motion: M2 slide (the entrance signature)

translateX(-24px) to 0 plus fade, cubic-bezier(0.19, 1, 0.22, 1), 550ms. One keyframe block implements it; every keyframe name starts with `mesora-`. A `prefers-reduced-motion: reduce` block disables it.

## Interaction kit: K2 gsap

GSAP with ScrollTrigger: timelines and pinned scroll scenes.

Packages for package.json dependencies: "gsap": "^3.15.1", "@gsap/react": "^2.1.2".

Typical import: `import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import { useGSAP } from "@gsap/react"; gsap.registerPlugin(useGSAP, ScrollTrigger);`

Signature interactions (the scaffold ships the first; all three exist by the end of the frontend phase):
1. a pinned scroll scene: one section pins while a scrubbed timeline plays the product's core transformation (before to after) with seed numbers
2. an intro timeline on first paint: the headline is split into word spans by hand and staggered in, followed by the product frame
3. a figure tween bound to a control: clicking it tweens the displayed seed value and its chart mark together

Rules:
- every GSAP call lives inside `useGSAP(() => { ... }, { scope: ref })` so cleanup is automatic
- wrap motion in `gsap.matchMedia()` and skip it under `(prefers-reduced-motion: reduce)`
- add the packages above to package.json `dependencies` (and `devDependencies` where listed) with exactly these ranges; the runner installs them
- every import of a kit package lives in a component that starts with `"use client"`
- server HTML must be readable with JavaScript off: never server-render content at opacity 0 or off screen; animate from the visible state or on interaction
- honor `prefers-reduced-motion: reduce`: the content and every control stay usable with motion off
- every interaction is driven by the real seed data; a decorative animation with no product meaning does not count as a signature

## Amendments (append-only; later phases add dated lines here, never edit anything above)
