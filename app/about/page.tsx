import type { Metadata } from "next";
import Link from "next/link";
import { PeerCall } from "@/components/peer-call";
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
    body: "Mesora is shaped as an open agentic website: three site actions in the page, declared in agent-manifest.json. The agent box turns one sentence into a district, diet, budget and start time, then website_add_my_constraints writes them into the link. The spec's browser runtime is not vendored yet.",
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
        <h1 className="max-w-[16ch] text-5xl sm:text-7xl">How Mesora picks a table</h1>
        <p className="max-w-[65ch] text-lg text-muted-foreground">
          Four ideas, each small. Together they let a group agree on a place without anyone handing a home address to an organizer or a
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
          n={5}
          alt="Two neon-outlined browser windows joined by a violet line: an event site on the left asks, Mesora on the right answers with one acid table pin"
          width={960}
          height={540}
          className="rounded-3xl"
        />
        <div className="space-y-5">
          <h2 className="text-3xl font-bold sm:text-4xl">Built on the open agentic web spec</h2>
          <p className="max-w-[65ch] text-muted-foreground">
            Mesora follows the Cognizant AI Lab open agentic web specification. The site publishes its network and capabilities as JSON
            and exposes three site actions that change what you see on the page. The spec&apos;s browser runtime file is still to be
            vendored, so no cross-site call runs yet.
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

      <section id="peer" aria-labelledby="peer-title" className="scroll-mt-24 space-y-4 border-t border-border pt-12">
        <h2 id="peer-title" className="text-3xl font-bold sm:text-4xl">When an event site asks Mesora</h2>
        <p className="max-w-[68ch] text-muted-foreground">
          An event page holds a Mesora link for its guests. Its agent asks the visitor for permission, calls Mesora&apos;s
          website_solve_plan with the link and gets back the same venue and start time you see on Friday&apos;s table. The link is
          decoded in the browser, so nobody&apos;s address leaves it.
        </p>
        <PeerCall />
      </section>

      <section className="space-y-4 border-t border-border pt-12">
        <h2 className="text-3xl font-bold sm:text-4xl">Models and keys</h2>
        <p className="max-w-[68ch] text-muted-foreground">
          The agent box sends the sentence you type to Mesora&apos;s /api/parse route. When the deployment has a model key, that route
          forwards the sentence to Mozilla Otari (alibaba/qwen3.8-flash) or to a free OpenRouter model and keeps only the four parsed
          fields in memory for ten minutes. With no key, a built-in rule parser reads it and nothing goes to a third party. The step
          form fills the same four fields without any model.
        </p>
        <p className="max-w-[68ch] text-muted-foreground">
          Travel times come from one OSRM table request per solve on the public OSRM server (router.project-osrm.org): driving minutes
          from each district center to each venue. OSRM sees district centers and venue points, never a name, the link or a home
          address. When OSRM does not answer, Mesora estimates straight-line distance times 1.4 at 25 km/h and labels the plan as
          estimated. Venues, diet options, prices and opening hours are still the Mesora sample list.
        </p>
        <ul className="max-w-[68ch] list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Our server: the typed sentence (/api/parse) and, for the sample groups, district, diet, budget and time (/api/plan).</li>
          <li>Otari or OpenRouter: the typed sentence, only when a key is configured.</li>
          <li>OSRM public server: district center and venue coordinates.</li>
          <li>Nobody: the link fragment after the #, where the group lives.</li>
        </ul>
        <Button asChild size="lg" className="mesora-glow">
          <Link href="/join/area">Try it on Friday supper</Link>
        </Button>
      </section>
    </div>
  );
}
