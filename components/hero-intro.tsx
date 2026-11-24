"use client";

// Kit K2 signature 2: the intro timeline on first paint. The headline is split into
// word spans by hand and staggered in with the M2 slide (x -24 to 0 plus fade, expo
// out, which is cubic-bezier(0.19, 1, 0.22, 1)), then the lede and CTA row, then the
// scene frame. Server HTML is fully visible; GSAP animates FROM that state after
// hydration, and skips everything under prefers-reduced-motion. Screen readers get the
// full headline once from the sr-only span; the word spans are aria-hidden.
import { Fragment, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

export function HeroIntro({ headline, className, children }: { headline: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const words = headline.split(" ");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 0.55 } });
        tl.from("[data-hero-word]", { x: -24, autoAlpha: 0, stagger: 0.07 })
          .from("[data-hero-rest]", { x: -24, autoAlpha: 0, stagger: 0.08 }, "-=0.3")
          .from("[data-hero-frame]", { x: -24, autoAlpha: 0, duration: 0.7 }, "-=0.25");
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className={cn(className)}>
      <h1 className="text-display font-extrabold">
        <span className="sr-only">{headline}</span>
        <span aria-hidden="true">
          {words.map((w, i) => (
            <Fragment key={`${w}-${i}`}>
              <span data-hero-word="" className="mesora-word">
                {w}
              </span>
              {i < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </span>
      </h1>
      {children}
    </section>
  );
}
