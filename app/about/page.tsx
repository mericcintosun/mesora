import type { Metadata } from "next";
import Link from "next/link";
import { SceneSlot } from "@/components/scene-slot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAY_MINUTES } from "@/lib/solver";

export const metadata: Metadata = { title: "Method" };

const PARTS = [
  {
    title: "The link is the database",
    body: "The group is JSON, compressed with lz-string, stored after the # in the URL. Browsers never send the fragment with a request, so the host serving Mesora cannot see who is coming. Up to eight people fit in a link short enough for any chat app.",
  },
  {
    title: "Your agent, your browser, your key",
    body: "Mesora is an open agentic website. Its agent network runs in the visitor's browser through the spec runtime. The front agent turns one sentence into a district, diet, budget and start time, then calls website_add_my_constraints to write them into the link.",
  },
  {
    title: "A solver with no LLM in it",
    body: `website_solve_plan is plain code. It keeps venues that feed everyone, fit the lowest budget and stay open ${STAY_MINUTES / 60} hours past the start, then picks the one whose longest trip is shortest. Ties go to the smaller total.`,
  },
  {
    title: "Callable by other agentic sites",
    body: "The network is declared in agent-manifest.json, so an event or restaurant site can hand Mesora a group link and ask for the fairest venue and time, after its visitor approves the call.",
  },
];

const ACTIONS = [
  ["website_add_my_constraints", "Adds or updates one person's rough area and limits in the link fragment."],
  ["website_solve_plan", "Runs the minimax solver on the group in the link and returns the venue, start time and every trip."],
  ["website_get_link", "Returns the current share link so the agent can hand it back to the visitor."],
];

export default function AboutPage() {
  return (
    <div className="space-y-16 py-12">
      <section className="mesora-stagger space-y-5">
        <h1 className="max-w-[16ch] text-5xl font-extrabold leading-none sm:text-7xl">How Mesora picks a table</h1>
        <p className="max-w-[65ch] text-lg text-muted-foreground">
          Four ideas, each small. Together they let a group agree on a place without anyone handing their location to an organizer or a
          server.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {PARTS.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <CardTitle className="text-xl">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="max-w-[65ch] text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid items-center gap-10 lg:grid-cols-2">
        <SceneSlot
          n={2}
          alt="Four phones in a row, each showing the same Mesora link growing by one line as a different friend's agent adds a district and a budget"
          width={960}
          height={640}
          className="rounded-3xl"
        />
        <div className="space-y-5">
          <h2 className="text-3xl font-bold sm:text-4xl">Built on the open agentic web spec</h2>
          <p className="max-w-[65ch] text-muted-foreground">
            Mesora follows the Cognizant AI Lab open agentic web specification. The site publishes its network and capabilities as JSON,
            loads the browser runtime, and exposes three site actions that change what you see on the page.
          </p>
          <ul className="space-y-3">
            {ACTIONS.map(([name, body]) => (
              <li key={name} className="rounded-3xl border-2 border-border p-4">
                <Badge variant="secondary">{name}</Badge>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href="/agent-manifest.json">Read agent-manifest.json</a>
            </Button>
            <Button asChild variant="ghost">
              <a href="/mesora.network.json">Read mesora.network.json</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="peer" aria-labelledby="peer-title" className="space-y-4 border-t border-border pt-12">
        <Badge variant="outline">Placeholder: the peer site is not built yet</Badge>
        <h2 id="peer-title" className="text-3xl font-bold sm:text-4xl">When an event site asks Mesora</h2>
        <p className="max-w-[68ch] text-muted-foreground">
          An event page will hold a Mesora link for its guests. Its own agent shows the visitor an approval card, then calls Mesora as a
          peer with the link and gets back the same venue and start time you see on Friday&apos;s table. The link still travels in the
          fragment, so neither site&apos;s server sees anyone&apos;s area.
        </p>
        <ol className="max-w-[68ch] list-decimal space-y-2 rounded-3xl border-2 border-dashed border-border p-6 pl-10 text-muted-foreground">
          <li>The event site&apos;s agent receives a Mesora link.</li>
          <li>The visitor approves the call on an approval card.</li>
          <li>The agent calls website_solve_plan on Mesora and shows the venue.</li>
        </ol>
      </section>

      <section className="space-y-4 border-t border-border pt-12">
        <h2 className="text-3xl font-bold sm:text-4xl">Models and keys</h2>
        <p className="max-w-[68ch] text-muted-foreground">
          The agent reads sentences with Mozilla Otari (alibaba/qwen3.8-flash) or a free OpenRouter model, using the visitor&apos;s own key.
          No key? The step-by-step form fills the same four fields and the solver, link and plan all work without any model at all.
        </p>
        <p className="max-w-[68ch] text-muted-foreground">
          Travel times come from one OSRM table request per solve: driving minutes from each district center to each venue, on the
          keyless public OSRM server. Only the district center leaves the server, never a name or an exact spot. When OSRM does not
          answer, Mesora estimates straight-line distance times 1.4 at 25 km/h and labels the plan as estimated. Venues, diet options,
          prices and opening hours are still the Mesora sample list.
        </p>
        <Button asChild size="lg" className="mesora-glow">
          <Link href="/join/area">Try it on Friday supper</Link>
        </Button>
      </section>
    </div>
  );
}
