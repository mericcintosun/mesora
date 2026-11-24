"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { GROUP_EVENT, siteActions } from "@/components/agent-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { groupFromHash, upsertParticipant } from "@/lib/codec";
import {
  BUDGET_OPTIONS,
  DIET_OPTIONS,
  DISTRICTS,
  OPEN_INVITE,
  SAMPLE_SENTENCE,
  TIME_OPTIONS,
  getDistrict,
  type Diet,
  type DistrictId,
  type Participant,
} from "@/lib/data";
import { solvePlan } from "@/lib/solver";
import { cn } from "@/lib/utils";

export const JOIN_STEPS = [
  { id: "area", label: "Area", question: "Where will you leave from?", hint: "Pick your district. Only this rough area goes into the link." },
  { id: "diet", label: "Diet", question: "What can you eat?", hint: "Mesora drops any venue that cannot feed everyone." },
  { id: "budget", label: "Budget", question: "What is your limit per head?", hint: "The group is capped at its lowest budget. Nobody sees whose it is." },
  { id: "time", label: "Time", question: "When can you get there?", hint: "The plan starts at the latest earliest time, then checks opening hours." },
] as const;

export type JoinStepId = (typeof JOIN_STEPS)[number]["id"];

interface Draft {
  name: string;
  district: DistrictId | null;
  diet: Diet;
  budgetTry: number | null;
  earliest: string | null;
}

const EMPTY: Draft = { name: "", district: null, diet: "any", budgetTry: null, earliest: null };
const DRAFT_KEY = "mesora-draft";

/** Same cap as parseInputSchema in lib/schemas.ts (a server module, so not imported here). */
const MAX_SENTENCE = 280;
/** Client-side cap on /api/parse (server side: 8 s plus one retry per provider). */
const PARSE_TIMEOUT_MS = 20_000;

type ParseAnswer =
  | {
      ok: true;
      constraints: { district: DistrictId | null; diet: Diet; budgetTry: number | null; earliest: string | null };
      source: string;
    }
  | { ok: false; error: string; hint: string };

/** Every parse source renders the same card; only this note says who read it. */
const SOURCE_NOTE: Record<string, string> = {
  otari: "Otari",
  openrouter: "OpenRouter",
  "claude-cli": "the local claude CLI",
  rules: "the built-in rule parser (no model answered)",
  fixture: "the saved answer for the sample sentence (no model answered)",
};

function toParticipant(d: Draft): Participant | null {
  if (!d.district) return null;
  return { name: d.name.trim() || "You", district: d.district, diet: d.diet, budgetTry: d.budgetTry ?? 400, earliest: d.earliest ?? "19:00" };
}

export function JoinFlow({ step }: { step: JoinStepId }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [group, setGroup] = useState({ title: OPEN_INVITE.title, participants: OPEN_INVITE.participants });
  const [hash, setHash] = useState("");
  const [sentence, setSentence] = useState("");
  const [agentState, setAgentState] = useState<{ status: "idle" | "done" | "error"; note?: string }>({ status: "idle" });
  const [parsePending, setParsePending] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [navPending, startNav] = useTransition();
  const pending = submitPending || navPending;

  // Load the draft (sessionStorage) and the group (URL fragment) after mount, so back and
  // forward between steps never lose input and server HTML stays deterministic.
  useEffect(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        setDraft({ ...EMPTY, ...(JSON.parse(saved) as Draft) });
      } catch {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    }
    const sync = () => {
      setHash(window.location.hash);
      const g = groupFromHash(window.location.hash);
      if (g) setGroup(g);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener(GROUP_EVENT, sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener(GROUP_EVENT, sync);
    };
  }, []);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const me = toParticipant(draft);
  const people = useMemo(() => (me ? upsertParticipant(group.participants, me) : group.participants), [group, me]);
  const solved = useMemo(() => solvePlan(people), [people]);
  // With nobody in the link there is no table to show yet.
  const preview = people.length ? solved : { ...solved, pick: null };
  const index = JOIN_STEPS.findIndex((s) => s.id === step);
  const current = JOIN_STEPS[index];
  const next = JOIN_STEPS[index + 1];
  const prev = JOIN_STEPS[index - 1];
  const canContinue = step === "area" ? !!draft.district : step === "budget" ? !!draft.budgetTry : step === "time" ? !!draft.earliest : true;

  // The agent request. `parsePending` is bound to the button's disabled prop and is set
  // by the request itself: true before fetch, false in finally. The timeout only aborts.
  async function askAgent() {
    if (parsePending) return;
    const text = (sentence.trim() || SAMPLE_SENTENCE).slice(0, MAX_SENTENCE);
    setParsePending(true);
    setAgentState({ status: "idle" });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      const data = (await res.json()) as ParseAnswer;
      if (!data.ok) throw new Error(data.hint);
      const c = data.constraints;
      update({
        district: c.district ?? draft.district,
        diet: c.diet,
        budgetTry: c.budgetTry ?? draft.budgetTry,
        earliest: c.earliest ?? draft.earliest,
      });
      setSentence(text);
      setAgentState({ status: "done", note: `Read by ${SOURCE_NOTE[data.source] ?? data.source}` });
    } catch (e) {
      const note = controller.signal.aborted
        ? "The agent took too long to answer."
        : e instanceof Error && e.message
          ? e.message
          : "The agent could not read that.";
      setAgentState({ status: "error", note });
    } finally {
      window.clearTimeout(timer);
      setParsePending(false);
    }
  }

  // The write. website_add_my_constraints goes through upsertParticipant, keyed by
  // participantKey (lib/codec.ts), so a double click replaces the row. `submitPending`
  // covers the write, `navPending` the route change to the result.
  function addToLink() {
    if (!me || pending) return;
    setSubmitPending(true);
    try {
      const out = siteActions.website_add_my_constraints({
        name: me.name,
        district: me.district,
        diet: me.diet,
        budget_try: me.budgetTry,
        earliest: me.earliest,
      });
      if (out.ok) {
        sessionStorage.removeItem(DRAFT_KEY);
        startNav(() => router.push(`/result/live${window.location.hash}`));
      }
    } finally {
      setSubmitPending(false);
    }
  }

  return (
    <div className="space-y-10 py-10">
      <nav aria-label="Progress" className="mesora-enter">
        <ol className="flex flex-wrap gap-2">
          {JOIN_STEPS.map((s, i) => (
            <li key={s.id}>
              <Link
                href={`/join/${s.id}${hash}`}
                aria-current={s.id === step ? "step" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold",
                  s.id === step ? "border-primary text-primary" : i < index ? "border-violet text-foreground" : "border-border text-muted-foreground"
                )}
              >
                {s.label}
              </Link>
            </li>
          ))}
          <li className="inline-flex min-h-11 items-center rounded-full border-2 border-dashed border-border px-4 py-1.5 text-sm font-semibold text-muted-foreground">
            Your table
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="mesora-stagger space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">{current.question}</h1>
          <p className="max-w-[65ch] text-muted-foreground">{current.hint}</p>

          {step === "area" && (
            <div className="space-y-6">
              <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="Your first name" aria-label="Your first name" maxLength={24} />
              <div className="flex flex-wrap gap-2">
                {DISTRICTS.map((d) => (
                  <Button key={d.id} variant="choice" aria-pressed={draft.district === d.id} onClick={() => update({ district: d.id })}>
                    {d.name}
                    <span className="text-xs font-normal opacity-70">{d.side}</span>
                  </Button>
                ))}
              </div>
              <Card variant="violet">
                <CardHeader>
                  <CardTitle>Or tell your agent in one sentence</CardTitle>
                  <CardDescription>
                    It fills all four steps. The sentence goes to Mesora&apos;s parse route (and to Otari or OpenRouter when a key is set), so
                    name a district, not a street. Only the four fields go into the link.
</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    placeholder={SAMPLE_SENTENCE}
                    aria-label="Describe your constraints"
                    maxLength={MAX_SENTENCE}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={askAgent} disabled={parsePending}>
                      {parsePending ? "Reading your sentence..." : "Let my agent fill it"}
                    </Button>
                    {agentState.status === "done" && <Badge variant="ok">{agentState.note}</Badge>}
                  </div>
                  {agentState.status === "error" && (
                    <ErrorState
                      title="Your agent did not answer"
                      body={`${agentState.note ?? "Something went wrong."} Nothing was added to the link.`}
                      onRetry={askAgent}
                      pending={parsePending}
                    >
                      <Button asChild variant="ghost">
                        <Link href={`/join/diet${hash}`}>Use the steps instead</Link>
                      </Button>
                    </ErrorState>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {step === "diet" && (
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((d) => (
                <Button key={d.id} size="lg" variant="choice" aria-pressed={draft.diet === d.id} onClick={() => update({ diet: d.id })}>
                  {d.label}
                </Button>
              ))}
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((b) => (
                  <Button key={b} variant="choice" aria-pressed={draft.budgetTry === b} onClick={() => update({ budgetTry: b })}>
                    {b} TL
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={100}
                max={5000}
                value={draft.budgetTry ?? ""}
                onChange={(e) => update({ budgetTry: e.target.value ? Number(e.target.value) : null })}
                placeholder="Or type an amount in TL"
                aria-label="Budget per head in Turkish lira"
                className="max-w-xs"
              />
            </div>
          )}

          {step === "time" && (
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((t) => (
                <Button key={t} size="lg" variant="choice" aria-pressed={draft.earliest === t} onClick={() => update({ earliest: t })}>
                  {t}
                </Button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {prev && (
              <Button asChild variant="ghost">
                <Link href={`/join/${prev.id}${hash}`}>Back to {prev.label.toLowerCase()}</Link>
              </Button>
            )}
            {next ? (
              <Button disabled={!canContinue} onClick={() => router.push(`/join/${next.id}${hash}`)}>
                Next: {next.label.toLowerCase()}
              </Button>
            ) : (
              <Button className="mesora-glow" disabled={pending || !me || !canContinue} onClick={addToLink}>
                {pending ? "Adding you..." : "Add me to the link"}
              </Button>
            )}
          </div>
        </section>

        <aside aria-label="Live preview">
          <Card variant={preview.pick ? "neon" : "default"} className="lg:sticky lg:top-24">
            <CardHeader>
              <CardDescription>{group.title}, the table so far</CardDescription>
              {preview.pick ? (
                <CardTitle className="text-2xl">{preview.pick.venue.name}</CardTitle>
              ) : (
                <CardTitle className="text-2xl">{people.length ? "No venue fits everyone yet" : "No table yet"}</CardTitle>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {preview.pick ? (
                <p className="text-sm">
                  {preview.pick.venue.area} at {preview.start}. Longest trip <strong className="text-primary">{preview.pick.longest} min</strong>, against{" "}
                  {preview.midpoint.longest} min at the map midpoint.
                </p>
              ) : people.length ? (
                <p className="text-sm text-muted-foreground">Try a higher budget or a later time. Every venue failed a diet, budget or hours check.</p>
              ) : null}
              {people.length === 0 && (
                <EmptyState
                  titleAs="p"
                  title="Nobody is here yet"
                  body="Type the sample sentence into the agent box, or pick your district, and you start the table."
                  href={`/join/area${hash}`}
                  cta="Type the sample sentence"
                />
              )}
              <ul className="space-y-2">
                {people.map((p) => {
                  const leg = preview.pick?.legs.find((l) => l.name === p.name);
                  return (
                    <li key={p.name} className={cn("flex min-h-11 items-center justify-between gap-3 rounded-full border-2 px-4 py-1.5 text-sm", me && p.name === me.name ? "border-primary" : "border-border")}>
                      <span className="min-w-0 truncate" title={`${p.name}, ${getDistrict(p.district).name}`}>
                        <strong>{p.name}</strong> <span className="text-muted-foreground">{getDistrict(p.district).name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{leg ? `${leg.minutes} min` : "waiting"}</span>
                    </li>
                  );
                })}
              </ul>
              {!me && <p className="text-sm text-muted-foreground">Pick your area to see where you would land.</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
