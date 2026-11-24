"use client";

import { useEffect, useMemo, useState } from "react";
import { GROUP_EVENT } from "@/components/agent-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import type { ServedPlan } from "@/lib/adapter";
import { groupFromHash, hashFor } from "@/lib/codec";
import type { Group } from "@/lib/data";
import { solvePlan, type Plan } from "@/lib/solver";
import type { ApiResponse, PlanView } from "@/lib/types";

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
  const scale = Math.max(80, plan.midpoint.longest);

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

      {pick && (
        <section aria-labelledby="trips" className="space-y-4">
          <h2 id="trips" className="text-2xl font-bold sm:text-3xl">
            Trip per person
          </h2>
          <Card>
            <CardContent className="space-y-5 pt-6">
              {pick.legs.map((leg, i) => {
                const before = plan.midpoint.legs[i]?.minutes ?? 0;
                return (
                  <div key={leg.name} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                    <span className="min-w-0 leading-tight">
                      <strong className="block break-words">{leg.name}</strong>
                      <span className="text-sm text-muted-foreground">{leg.districtName}</span>
                    </span>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-3 min-w-0 rounded-full bg-primary" style={{ width: `${(leg.minutes / scale) * 100}%` }} />
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{leg.minutes} min</span>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="h-3 min-w-0 rounded-full bg-violet" style={{ width: `${(before / scale) * 100}%` }} />
                        <span className="text-sm text-muted-foreground tabular-nums">{before} min at midpoint</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

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
