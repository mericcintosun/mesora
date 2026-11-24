"use client";

// Kit K2 signature 1: a pinned scroll scene. From md up the section pins while a
// scrubbed timeline moves every friend's trip bar from the geographic-midpoint venue
// to the venue Mesora picked, and the longest-trip figure counts down with it. On
// phones the same timeline scrubs while the section scrolls past, without a pin, so a
// tall section never gets stuck behind the viewport.
// All numbers come from `rows`, which app/page.tsx builds with solvePlan on the seed
// (lib/data/seed.ts, Friday supper: 74 min at the midpoint, 38 min at the pick).
// Server HTML renders the midpoint state fully visible, plus a caption naming both
// outcomes, so the scene reads fine with JavaScript or motion off.
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
      const section = ref.current;
      if (!section) return;

      const build = (scrollTrigger: ScrollTrigger.Vars) => {
        const figure = { v: midpointLongest };
        section.setAttribute("data-phase", "before");
        const tl = gsap.timeline({
          scrollTrigger: {
            ...scrollTrigger,
            trigger: section,
            onUpdate: (self) => section.setAttribute("data-phase", self.progress > 0.5 ? "after" : "before"),
          },
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
        return () => section.removeAttribute("data-phase");
      };

      const mm = gsap.matchMedia();
      // Tablet and desktop: the section is one viewport tall, so pinning it is safe.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () =>
        build({ start: "top top+=64", end: "+=520", scrub: 0.6, pin: true })
      );
      // Phones: no pin, scrub while the bars cross the middle of the screen.
      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () =>
        build({ start: "top 70%", end: "bottom 60%", scrub: 0.6 })
      );
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      aria-labelledby="scene-title"
      className="group relative flex w-full flex-col justify-center gap-8 py-16 md:min-h-[calc(100svh-4rem)] md:py-10"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="scene-title" className="max-w-[16ch] text-3xl sm:text-5xl">
          Same four friends. Scroll to move the table.
        </h2>
        <p className="flex flex-col items-start sm:items-end">
          <span className="text-sm font-semibold text-muted-foreground">Longest trip</span>
          <span className="flex items-baseline gap-1">
            <span ref={figureRef} className="font-[family-name:var(--font-display)] text-figure font-extrabold tabular-nums text-primary">
              {midpointLongest}
            </span>
            <span className="text-xl font-semibold">min</span>
          </span>
        </p>
      </div>

      {/* With JS off both pills show full; with JS on, data-phase lights the active venue. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <p className="rounded-full border-2 border-violet px-5 py-2.5 text-sm font-semibold group-data-[phase=after]:border-line group-data-[phase=after]:text-muted-foreground">
          Geographic midpoint: {midpointName}
        </p>
        <p className="rounded-full border-2 border-primary px-5 py-2.5 text-sm font-semibold group-data-[phase=before]:border-line group-data-[phase=before]:text-muted-foreground">
          Mesora: {pickName}, {start}
        </p>
      </div>

      <ul className="space-y-6 border-y-2 border-line py-8">
        {rows.map((r, i) => (
          <li
            key={r.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 sm:grid-cols-[10rem_minmax(0,1fr)_5rem] sm:items-center"
          >
            <span className="leading-tight">
              <span className="font-bold">{r.name}</span>{" "}
              <span className="text-sm text-muted-foreground sm:block">{r.districtName}</span>
            </span>
            <span className="text-right font-[family-name:var(--font-display)] font-bold tabular-nums sm:order-last">
              <span data-min={i}>{r.before}</span> min
            </span>
            <span className="col-span-2 h-4 w-full rounded-full bg-secondary sm:col-span-1">
              <span data-bar={i} className="block h-4 rounded-full bg-primary" style={{ width: pct(r.before) }} />
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
