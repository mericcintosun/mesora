# CLAUDE.md: Mesora

Read IDENTITY.md first; it is law for color, font, route, layout and motion. DEMO.md is the demo contract. HANDOFF.md holds state and next steps.

## Commands

- `npm install`
- `npm run build` (must stay green after every change)
- `npm run seed` (prints a deterministic summary of `lib/data/seed.ts`, writes nothing)
- `npm run dev`

## Architecture in one breath

Types in `lib/types.ts`. Seed values in `lib/data/seed.ts` (fixed ids, no clock, no randomness). `lib/data.ts` re-exports both plus `getGroup` and `getDistrict`. Pages and API routes read through `getAdapter()` in `lib/adapter.ts` (`ADAPTER_MODE=fake` by default). Client components may import the seed and `solvePlan` directly because the group lives in the URL fragment.

## Stack pitfalls

- Next 15 App Router: `params` is a Promise, await it. Values exported from a `"use client"` module are client references on the server; do not call them in server code.
- Tailwind v4 with no config file. Tokens live in `app/globals.css` (`:root` plus `@theme inline`). No raw hex anywhere else except the `OG` block in `app/opengraph-image.tsx`.
- GSAP only inside `useGSAP(..., { scope })` and `gsap.matchMedia()`, skipped under reduced motion. One animation library only.
- The Otari base URL ends in `/api/v1`.
- The fragment (`#g=...`) never leaves the browser. Never send it, a street address or exact coordinates to any server, API route or analytics.

## Never touch

`public/illustrations/`, `.next/`, `node_modules/` (and `public/logo.svg`, `app/icon.svg`, `package-lock.json` unless asked).

## Vercel guardrails

- No runtime filesystem writes.
- `useSearchParams` only under `Suspense`.
- No Node-only APIs in edge paths.
- No custom server.
- No `output: export`.
- Every `process.env` key is mirrored in `.env.example`.

## Writing rules

English. No em dash, en dash or double hyphen as a dash. None of: seamless, leverage, empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless.

When compacting preserve the list of modified files and test commands.
