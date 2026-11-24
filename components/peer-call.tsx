"use client";

// DEMO step 7: another site's agent asks Mesora for the group plan.
// Simulated: the "event site" lives in this page and calls Mesora's website_solve_plan
// through siteActions (components/agent-bridge.tsx). The cross-site runtime call needs
// the vendored spec runtime (public/agentic/runtime.js), which is not in the repo yet.
// The Friday supper link is built and decoded in this browser; nothing is fetched.
import Link from "next/link";
import { useRef, useState } from "react";
import { siteActions } from "@/components/agent-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { hashFor } from "@/lib/codec";
import { GROUPS } from "@/lib/data";

const PEER_NAME = "Friday Night Events";
/** The peer gives up after 10 seconds, as in the idea. */
const PEER_TIMEOUT_MS = 10_000;

type Reply = {
  venue: string;
  area: string | null;
  start: string;
  longest: number;
  midpointLongest: number;
};

type PeerState =
  | { status: "idle" }
  | { status: "consent" }
  | { status: "cancelled" }
  | { status: "loading" }
  | { status: "error"; reason: string }
  | { status: "done"; reply: Reply };

function fridayLink(): string {
  const friday = GROUPS.find((g) => g.id === "friday-supper") ?? GROUPS[0];
  return `${window.location.origin}/result/live${hashFor(friday.title, friday.participants)}`;
}

/** Runs the action on the next tick and races it against the peer timeout. */
function askMesora(link: string): Promise<Reply> {
  const call = new Promise<Reply>((resolve, reject) => {
    window.setTimeout(() => {
      try {
        const out = siteActions.website_solve_plan({ link });
        if ("error" in out) return reject(new Error(out.error));
        if (!out.ok || !out.venue || out.longest_trip_min === null) {
          return reject(new Error("Mesora found no venue that fits everyone in this link."));
        }
        resolve({
          venue: out.venue,
          area: out.area,
          start: out.start,
          longest: out.longest_trip_min,
          midpointLongest: out.midpoint_longest_trip_min,
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Mesora's action failed."));
      }
    }, 0);
  });
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error("Mesora did not answer within 10 seconds.")), PEER_TIMEOUT_MS);
  });
  return Promise.race([call, timeout]).finally(() => window.clearTimeout(timer));
}

export function PeerCall() {
  const [state, setState] = useState<PeerState>({ status: "idle" });
  const runId = useRef(0);
  const loading = state.status === "loading";

  async function allow() {
    if (loading) return;
    const id = ++runId.current;
    setState({ status: "loading" });
    try {
      const reply = await askMesora(fridayLink());
      if (id === runId.current) setState({ status: "done", reply });
    } catch (e) {
      if (id === runId.current) setState({ status: "error", reason: e instanceof Error ? e.message : "The call failed." });
    }
  }

  return (
    <Card variant="violet" className="max-w-3xl">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Simulated event site</Badge>
        </div>
        <CardTitle className="text-2xl">{PEER_NAME}</CardTitle>
        <CardDescription>
          Simulated event site: it calls Mesora&apos;s website_solve_plan in this page. The cross-site runtime call needs the vendored
          spec runtime, which is listed in the handoff notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm">
          This page holds the Mesora link for Friday supper: four friends in Kadıköy, Beşiktaş, Bakırköy and Ataşehir.
        </p>

        {state.status !== "consent" && (
          <Button
            size="lg"
            className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-left"
            onClick={() => setState({ status: "consent" })}
            disabled={loading}
          >
            {loading ? "Waiting for Mesora..." : "Ask Mesora for the group plan"}
          </Button>
        )}

        {state.status === "idle" && (
          <p className="text-sm text-muted-foreground">
            Nothing has been asked yet. Press the button and approve the call; Mesora&apos;s venue, start time and both longest trips will
            appear here.
          </p>
        )}

        {state.status === "consent" && (
          <div role="dialog" aria-labelledby="peer-consent-title" className="mesora-enter space-y-4 rounded-3xl border-2 border-primary bg-background p-5">
            <p id="peer-consent-title" className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {PEER_NAME} wants to run Mesora&apos;s plan for this group.
            </p>
            <p className="text-sm text-muted-foreground">
              It sends the group link to website_solve_plan once. The link is read in this browser; no address and no part after the #
              goes to a server.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="min-h-11" onClick={allow}>
                Allow once
              </Button>
              <Button className="min-h-11" variant="ghost" onClick={() => setState({ status: "cancelled" })}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {state.status === "cancelled" && (
          <p role="status" className="text-sm text-muted-foreground">
            You declined, so {PEER_NAME} did not call Mesora. Press the button again to ask.
          </p>
        )}

        {loading && (
          <p role="status" className="text-sm text-muted-foreground">
            Calling website_solve_plan with the Friday supper link. The event site gives up after 10 seconds.
          </p>
        )}

        {state.status === "error" && (
          <ErrorState
            titleAs="p"
            title="Mesora did not answer the event site"
            body={`${state.reason} Nothing was shared.`}
            onRetry={allow}
            retryLabel="Retry"
          />
        )}

        {state.status === "done" && (
          <div role="status" className="mesora-enter space-y-3 rounded-3xl border-2 border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">Mesora answered {PEER_NAME}:</p>
            <p className="break-words font-[family-name:var(--font-display)] text-2xl font-bold text-primary">{state.reply.venue}</p>
            <p className="text-sm">
              {state.reply.area ? `${state.reply.area}, ` : ""}start {state.reply.start}.
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border-2 border-primary p-4">
                <dt className="text-sm text-muted-foreground">Longest trip, Mesora&apos;s pick</dt>
                <dd className="text-xl font-bold tabular-nums">{state.reply.longest} min</dd>
              </div>
              <div className="rounded-3xl border-2 border-violet p-4">
                <dt className="text-sm text-muted-foreground">Longest trip, map midpoint</dt>
                <dd className="text-xl font-bold tabular-nums">{state.reply.midpointLongest} min</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/result/friday-supper">Open the plan</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
