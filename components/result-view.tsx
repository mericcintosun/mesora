"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GROUP_EVENT } from "@/components/agent-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { groupFromHash, hashFor } from "@/lib/codec";
import type { Group } from "@/lib/data";
import { solvePlan } from "@/lib/solver";

type GroupLike = Pick<Group, "title" | "participants">;

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
      <Button asChild size="lg" variant="ghost">
        <a href={`/result/live${hashFor(group.title, group.participants)}`}>Open it as a friend would</a>
      </Button>
      {copied === "fail" && <Badge variant="destructive">Clipboard blocked. Copy the address bar instead.</Badge>}
    </div>
  );
}

export function ResultView({ seeded }: { seeded: GroupLike | null }) {
  const [group, setGroup] = useState<GroupLike | null>(seeded);
  const [ready, setReady] = useState(!!seeded);

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

  if (!ready) {
    return (
      <Card className="my-16">
        <CardHeader>
          <CardTitle>Reading the link...</CardTitle>
          <CardDescription>Your browser is unpacking the group from the part after the #.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!group || group.participants.length === 0) {
    return (
      <Card className="my-16">
        <CardHeader>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight">Nobody is in this link yet</h1>
          <CardDescription>
            Add your area to start the table, or open the Mesora link a friend sent you. The group lives after the # in the link, so a
            bare /result/live has nothing to show.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/join/area">Add your area</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const plan = solvePlan(group.participants);
  const pick = plan.pick;
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
          <>
            <h1 className="text-5xl font-extrabold leading-none sm:text-7xl">No table fits everyone</h1>
            <p className="max-w-[65ch] text-lg text-muted-foreground">Every venue failed a diet, budget or opening hours check. Someone can raise a budget or pick a later time.</p>
          </>
        )}
        <ShareLinkButton group={group} />
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
              <p className="text-sm text-muted-foreground">
                Travel times come from a cached transit table for this demo{plan.travelSource === "estimate" ? " (estimated)" : ""}.
              </p>
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
