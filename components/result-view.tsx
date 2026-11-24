"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GROUP_EVENT } from "@/components/agent-bridge";
import { SceneSlot } from "@/components/scene-slot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import type { ServedPlan } from "@/lib/adapter";
import { groupFromHash, hashFor } from "@/lib/codec";
import type { Group } from "@/lib/data";
import { solvePlan, type Plan } from "@/lib/solver";
import type { ApiResponse, Candidate, PlanView } from "@/lib/types";

gsap.registerPlugin(useGSAP);

type GroupLike = Pick<Group, "title" | "participants">;

/** Where the minutes on screen came from, in words. */
type SourceKind = "sample" | "live" | "estimate" | "fallback" | "fragment";

const SOURCE_LINE: Record<SourceKind, string> = {
  sample: "Sample data: travel times come from a cached table. The live engine is switched off on this deployment.",
  live: "Live source: OSRM public routing, driving minutes between district centers, venues from the Mesora sample list.",
  estimate: "Estimated: the routing service did not answer, so minutes are straight-line distance times 1.4.",
  fallback: "Sample data: the live engine failed on this request, so travel times come from the cached table.",
  fragment: "Computed in your browser from the link. Travel times come from a cached table.",
};

/** Client-side cap on the same-origin /api/plan retry (server side: 8 s plus one retry). */
const PLAN_TIMEOUT_MS = 20_000;

function sourceKind(served: ServedPlan | null): SourceKind {
  if (!served) return "fragment";
  if (served.fellBack) return "fallback";
  if (served.source === "fake" || served.plan.travelSource === "seed") return "sample";
  return served.plan.travelSource === "estimate" ? "estimate" : "live";
}

/** The API answers with "Person n"; put the seeded names back by position, in the browser. */
function withNames(plan: PlanView, group: GroupLike): Plan {
  const rename = (legs: PlanView["midpoint"]["legs"]) => legs.map((l, i) => ({ ...l, name: group.participants[i]?.name ?? l.name }));
  const candidates = plan.candidates.map((c) => ({ ...c, legs: rename(c.legs) }));
  const byId = (id: string | undefined) => candidates.find((c) => c.venue.id === id);
  return {
    ...plan,
    candidates,
    pick: plan.pick ? (byId(plan.pick.venue.id) ?? { ...plan.pick, legs: rename(plan.pick.legs) }) : null,
    midpoint: byId(plan.midpoint.venue.id) ?? { ...plan.midpoint, legs: rename(plan.midpoint.legs) },
  };
}

/** Copies the share link, fragment included, so the next friend can add themselves. */
function ShareLinkButton({ group }: { group: GroupLike }) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    const url = `${window.location.origin}/join/area${hashFor(group.title, group.participants)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg" variant="outline" onClick={copy} className="max-w-full whitespace-normal text-left">
        {copied === "ok" ? "Link copied, paste it in the group chat" : "Copy the group link"}
      </Button>
      {/* A plain anchor keeps the #g= fragment, which only the browser ever reads. */}
      <Button asChild size="lg" variant="ghost" className="max-w-full whitespace-normal">
        <a href={`/result/live${hashFor(group.title, group.participants)}`}>Open it as a friend would</a>
      </Button>
      {copied === "fail" && <Badge variant="destructive">Clipboard blocked. Copy the address bar instead.</Badge>}
    </div>
  );
}

/**
 * Kit K2 signature 3: "Compare with midpoint". Pressing it tweens the longest-trip
 * figure and every trip bar from Mesora's pick to the geographic midpoint (Friday
 * supper on the seed: 38 to 74 min) and back. One gsap.to on a plain object drives
 * every mark through onUpdate, so the figure and the bars always move together.
 * Every number comes from the plan object (solvePlan on lib/data/seed.ts, or OSRM
 * minutes in real mode). React renders the pick state and never rewrites the tweened
 * nodes, because their props do not change between renders. Under
 * prefers-reduced-motion the values switch instantly.
 */
function TripCompare({ plan, pick }: { plan: Plan; pick: Candidate }) {
  const ref = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLSpanElement>(null);
  const mix = useRef({ t: 0 });
  const animate = useRef(false);
  const [compare, setCompare] = useState(false);
  const scale = Math.max(80, plan.midpoint.longest);
  const rows = pick.legs.map((leg, i) => ({ leg, from: leg.minutes, to: plan.midpoint.legs[i]?.minutes ?? leg.minutes }));

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        animate.current = true;
        return () => {
          animate.current = false;
        };
      });
    },
    { scope: ref }
  );

  const paint = (t: number) => {
    const root = ref.current;
    if (!root) return;
    if (figureRef.current) figureRef.current.textContent = String(Math.round(pick.longest + (plan.midpoint.longest - pick.longest) * t));
    rows.forEach((r, i) => {
      const m = r.from + (r.to - r.from) * t;
      const bar = root.querySelector<HTMLElement>(`[data-trip-bar="${i}"]`);
      const label = root.querySelector<HTMLElement>(`[data-trip-min="${i}"]`);
      if (bar) bar.style.width = `${Math.min(100, (m / scale) * 100)}%`;
      if (label) label.textContent = String(Math.round(m));
    });
  };

  const toggle = contextSafe(() => {
    const next = !compare;
    setCompare(next);
    const target = next ? 1 : 0;
    gsap.killTweensOf(mix.current);
    if (!animate.current) {
      mix.current.t = target;
      paint(target);
      return;
    }
    gsap.to(mix.current, { t: target, duration: 0.55, ease: "expo.out", onUpdate: () => paint(mix.current.t) });
  });

  return (
    <section ref={ref} aria-labelledby="trips" data-compare={compare ? "on" : "off"} className="group space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 id="trips" className="text-2xl sm:text-3xl">
            Trip per person
          </h2>
          <p aria-live="polite" className="text-muted-foreground">
            {compare ? `At the map midpoint, ${plan.midpoint.venue.name}` : `At Mesora's pick, ${pick.venue.name}`}
          </p>
        </div>
        <p className="flex flex-col items-start sm:items-end">
          <span className="text-sm font-semibold text-muted-foreground">Longest trip</span>
          <span className="flex items-baseline gap-1">
            <span
              ref={figureRef}
              className="font-[family-name:var(--font-display)] text-figure font-extrabold tabular-nums text-primary group-data-[compare=on]:text-violet"
            >
              {pick.longest}
            </span>
            <span className="text-xl font-semibold">min</span>
          </span>
        </p>
      </div>

      <Button variant="secondary" size="lg" aria-pressed={compare} onClick={toggle}>
        Compare with midpoint
      </Button>

      <ul className="space-y-6 border-y-2 border-line py-8">
        {rows.map((r, i) => (
          <li
            key={r.leg.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 sm:grid-cols-[10rem_minmax(0,1fr)_5rem] sm:items-center"
          >
            <span className="min-w-0 leading-tight">
              <strong className="break-words">{r.leg.name}</strong>{" "}
              <span className="text-sm text-muted-foreground sm:block">{r.leg.districtName}</span>
            </span>
            <span className="text-right font-[family-name:var(--font-display)] font-bold tabular-nums sm:order-last">
              <span data-trip-min={i}>{r.from}</span> min
            </span>
            <span className="col-span-2 h-4 w-full rounded-full bg-secondary sm:col-span-1">
              <span
                data-trip-bar={i}
                className="block h-4 rounded-full bg-primary transition-colors duration-500 group-data-[compare=on]:bg-violet"
                style={{ width: `${Math.min(100, (r.from / scale) * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * One data flow per route, no chained effects:
 * - seeded group (friday-supper, sunday-brunch): the server solved it (initialPlan), so
 *   nothing is fetched on mount. The only fetch is retryPlan, bound to the ErrorState.
 * - fragment group (/result/live): one effect decodes the #g= fragment, and the plan is
 *   solved in the browser with useMemo. The fragment never leaves the browser.
 */
export function ResultView({ seeded, initialPlan }: { seeded: GroupLike | null; initialPlan: ServedPlan | null }) {
  const [group, setGroup] = useState<GroupLike | null>(seeded);
  const [ready, setReady] = useState(!!seeded);
  const [served, setServed] = useState<ServedPlan | null>(initialPlan);
  const [retry, setRetry] = useState<{ pending: boolean; failed: boolean }>({ pending: false, failed: false });

  useEffect(() => {
    if (seeded) return;
    const sync = () => {
      setGroup(groupFromHash(window.location.hash));
      setReady(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener(GROUP_EVENT, sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener(GROUP_EVENT, sync);
    };
  }, [seeded]);

  // Seeded groups only, and only when the visitor presses Retry. Sends district, diet,
  // budget and start time, never names or the fragment.
  async function retryPlan() {
    if (!seeded || retry.pending) return;
    setRetry({ pending: true, failed: false });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), PLAN_TIMEOUT_MS);
    try {
      const participants = seeded.participants.map((p) => ({
        district: p.district,
        diet: p.diet,
        budgetTry: p.budgetTry,
        earliest: p.earliest,
      }));
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants }),
        signal: controller.signal,
      });
      const body = (await res.json()) as ApiResponse<PlanView>;
      if (!body.ok) throw new Error(body.hint);
      setServed({ plan: withNames(body.data, seeded), source: body.source, fellBack: false });
      setRetry({ pending: false, failed: false });
    } catch {
      setRetry({ pending: false, failed: true });
    } finally {
      window.clearTimeout(timer);
    }
  }

  const plan: Plan | null = useMemo(() => {
    if (served) return served.plan;
    if (!seeded && group && group.participants.length) return solvePlan(group.participants);
    return null;
  }, [served, seeded, group]);

  if (!ready) {
    return <Skeleton label="Reading the link. Your browser is unpacking the group from the part after the #." className="my-16" />;
  }

  if (!group || group.participants.length === 0) {
    return (
      <EmptyState
        className="my-16"
        titleAs="h1"
        title="Nobody is in this link yet"
        body="Add your area to start the table, or open the Mesora link a friend sent you. The group lives after the # in the link, so a bare /result/live has nothing to show."
        href="/join/area"
        cta="Add your area"
        art={
          <SceneSlot
            n={4}
            alt="An empty neon-outlined table with one acid chair lit and three dark chairs waiting, a share link drawn as a violet loop above it"
            width={640}
            height={600}
            className="mx-auto max-w-xs"
          />
        }
      />
    );
  }

  if (!plan) {
    return (
      <ErrorState
        className="my-16"
        titleAs="h1"
        title={`${group.title} did not load`}
        body={
          retry.failed
            ? "The plan service still did not answer. Your link is safe in the address bar. Try again in a moment."
            : "The server could not solve this table. Your link is safe in the address bar."
        }
        onRetry={retryPlan}
        pending={retry.pending}
      />
    );
  }

  const pick = plan.pick;
  const kind = sourceKind(served);

  return (
    <div className="space-y-12 py-10">
      <section className="mesora-stagger space-y-4">
        <p className="text-sm font-semibold text-muted-foreground">
          {group.title}, {group.participants.length} people, start {plan.start}
        </p>
        {pick ? (
          <>
            <h1 className="mesora-glow-text break-words text-5xl font-extrabold leading-none text-primary sm:text-7xl">{pick.venue.name}</h1>
            <p className="max-w-[65ch] text-lg">
              {pick.venue.area}. Nobody rides longer than <strong>{pick.longest} minutes</strong>. The map midpoint, {plan.midpoint.venue.name},
              would have sent someone on a {plan.midpoint.longest} minute trip.
            </p>
          </>
        ) : (
          <EmptyState
            titleAs="h1"
            title="No table fits everyone"
            body="Every venue failed a diet, budget or opening hours check. Someone can raise a budget or pick a later time."
            href="/join/budget"
            cta="Change a budget"
          />
        )}
        <ShareLinkButton group={group} />
        {/* Outside the trips card, so a no-fit group still says where its minutes came from. */}
        <p className="max-w-[65ch] text-sm text-muted-foreground" data-source={kind}>
          {SOURCE_LINE[kind]}
        </p>
        {(kind === "estimate" || kind === "fallback") && (
          <p role="status" className="max-w-[65ch] text-sm text-[color:var(--state-warn)]">
            These minutes are not live routing. Reload later for OSRM minutes.
          </p>
        )}
      </section>

      {pick && <TripCompare plan={plan} pick={pick} />}

      <section aria-labelledby="considered" className="space-y-4">
        <h2 id="considered" className="text-2xl font-bold sm:text-3xl">
          Every venue Mesora weighed
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {plan.candidates.map((c) => (
            <li key={c.venue.id}>
              <Card variant={c.excluded ? "dim" : c.venue.id === pick?.venue.id ? "neon" : "default"} className="h-full">
                <CardHeader className="gap-2 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{c.venue.name}</CardTitle>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">longest {c.longest} min</span>
                  </div>
                  <CardDescription>
                    {c.venue.area}, about {c.venue.avgSpendTry} TL, {c.venue.opens} to {c.venue.closes}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {c.excluded ? (
                      <Badge variant="destructive">{c.excluded}</Badge>
                    ) : (
                      <Badge variant="ok">Fits everyone</Badge>
                    )}
                    {c.venue.id === plan.midpoint.venue.id && <Badge variant="secondary">Map midpoint</Badge>}
                    {c.venue.outdoor && <Badge variant="outline">Outdoor seating</Badge>}
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
