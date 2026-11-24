"use client";

// Kit K2 signature 1: a pinned scroll scene. The section pins while a scrubbed
// timeline moves every friend's trip bar from the geographic-midpoint venue to the
// venue Mesora picked, and the longest-trip figure counts down with it.
// Server HTML renders the "midpoint" state fully visible, plus a text caption
// naming both outcomes, so the scene reads fine with JavaScript or motion off.
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface SceneRow {
  name: string;
  districtName: string;
  before: number;
  after: number;
}

interface FairnessSceneProps {
  rows: SceneRow[];
  midpointName: string;
  midpointLongest: number;
  pickName: string;
  pickLongest: number;
  start: string;
}

const SCALE = 80;
const pct = (m: number) => `${Math.min(100, (m / SCALE) * 100)}%`;

export function FairnessScene({ rows, midpointName, midpointLongest, pickName, pickLongest, start }: FairnessSceneProps) {
  const ref = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const figure = { v: midpointLongest };
        const tl = gsap.timeline({
          scrollTrigger: { trigger: ref.current, start: "top top+=64", end: "+=900", scrub: 0.6, pin: true },
        });
        rows.forEach((r, i) => {
          tl.to(`[data-bar="${i}"]`, { width: pct(r.after), ease: "none" }, 0);
          tl.to(`[data-min="${i}"]`, { innerText: r.after, snap: { innerText: 1 }, ease: "none" }, 0);
        });
        tl.to(
          figure,
          {
            v: pickLongest,
            ease: "none",
            onUpdate: () => {
              if (figureRef.current) figureRef.current.textContent = String(Math.round(figure.v));
            },
          },
          0
        );
        tl.to("[data-venue='before']", { opacity: 0.35, ease: "none" }, 0);
        tl.fromTo("[data-venue='after']", { opacity: 0.35 }, { opacity: 1, ease: "none" }, 0);
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} aria-labelledby="scene-title" className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col justify-center gap-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 id="scene-title" className="max-w-[18ch] text-3xl font-bold sm:text-5xl">
          Same four friends. Scroll to move the table.
        </h2>
        <p className="text-right">
          <span className="block text-sm font-semibold text-muted-foreground">Longest trip</span>
          <span ref={figureRef} className="font-[family-name:var(--font-display)] text-6xl font-extrabold text-primary sm:text-7xl">
            {midpointLongest}
          </span>
          <span className="ml-1 text-xl font-semibold">min</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <p data-venue="before" className="rounded-full border-2 border-violet px-5 py-2.5 text-sm font-semibold">
          Geographic midpoint: {midpointName}
        </p>
        <p data-venue="after" className="rounded-full border-2 border-primary px-5 py-2.5 text-sm font-semibold">
          Mesora: {pickName}, {start}
        </p>
      </div>

      <ul className="space-y-4 rounded-3xl border-2 border-border bg-card p-6 sm:p-8">
        {rows.map((r, i) => (
          <li key={r.name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_5rem] sm:gap-4">
            <span className="leading-tight">
              <span className="block font-bold">{r.name}</span>
              <span className="text-sm text-muted-foreground">{r.districtName}</span>
            </span>
            <span className="h-4 w-full rounded-full bg-secondary">
              <span data-bar={i} className="block h-4 rounded-full bg-primary" style={{ width: pct(r.before) }} />
            </span>
            <span className="text-right font-[family-name:var(--font-display)] font-bold tabular-nums">
              <span data-min={i}>{r.before}</span> min
            </span>
          </li>
        ))}
      </ul>

      <p className="max-w-[70ch] text-muted-foreground">
        At {midpointName}, the longest trip is {midpointLongest} minutes. At {pickName}, Mesora gets it down to {pickLongest}, and every
        venue it considered fits the whole group&apos;s diet, budget and opening hours.
      </p>
    </section>
  );
}
