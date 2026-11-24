import type { Metadata } from "next";
import Link from "next/link";
import { FairnessScene } from "@/components/fairness-scene";
import { HeroIntro } from "@/components/hero-intro";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";
import { getAdapter } from "@/lib/adapter";
import { solvePlan } from "@/lib/solver";

export const metadata: Metadata = { title: "Meet where nobody rides an hour" };

function FoldToggle() {
  return (
    <span className="shrink-0 rounded-full border-2 border-line px-3 text-sm group-open:border-primary">
      <span className="group-open:hidden">more</span>
      <span className="hidden group-open:inline">less</span>
    </span>
  );
}

export default async function Home() {
  const adapter = getAdapter();
  const friday = (await adapter.getGroup("friday-supper")) ?? (await adapter.listGroups())[0];
  // The pinned scene is a fixed before/after on the seed table (74 vs 38), in every mode.
  // Live OSRM minutes appear on /result/friday-supper instead.
  const plan = solvePlan(friday.participants, await adapter.listVenues());
  const pick = plan.pick;
  const rows = friday.participants.map((p, i) => ({
    name: p.name,
    districtName: plan.midpoint.legs[i].districtName,
    before: plan.midpoint.legs[i].minutes,
    after: pick ? pick.legs[i].minutes : plan.midpoint.legs[i].minutes,
  }));

  return (
    <>
      {/* L1 poster: headline, one sentence, one CTA row, then the scene strip. No card, no side column. */}
      <HeroIntro
        headline="Meet where nobody rides an hour."
        className="flex min-h-[calc(100svh-4rem)] flex-col justify-center gap-8 py-10"
      >
        <p data-hero-rest="" className="max-w-[46ch] text-lg text-muted-foreground sm:text-xl">
          Each friend adds a district, diet, budget and start time to one link, and Mesora picks the table where the longest trip is
          shortest.
        </p>
        <div data-hero-rest="" className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="mesora-glow">
            <Link href="/join/area">Add yourself to Friday supper</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/result/friday-supper">See Friday&apos;s table</Link>
          </Button>
        </div>
        <div data-hero-frame="" className="-mx-5 sm:mx-0">
          <SceneSlot
            n={1}
            alt="Night map of Istanbul with four neon route lines from Kadıköy, Beşiktaş, Bakırköy and Ataşehir meeting at one glowing table in Yenikapı"
            width={1440}
            height={360}
            className="h-44 w-full object-cover sm:h-auto"
          />
        </div>
      </HeroIntro>

      {pick ? (
        <FairnessScene
          rows={rows}
          midpointName={plan.midpoint.venue.name}
          midpointLongest={plan.midpoint.longest}
          pickName={pick.venue.name}
          pickLongest={pick.longest}
          start={plan.start}
        />
      ) : null}

      <section aria-labelledby="why-title" className="space-y-6 border-t border-border py-20">
        <h2 id="why-title" className="text-3xl sm:text-5xl">
          Two questions people ask first
        </h2>
        <div className="space-y-4">
          <details className="group rounded-3xl border-2 border-violet px-6 py-5">
            <summary className="flex items-start justify-between gap-4">
              <span className="space-y-1">
                <span className="block font-[family-name:var(--font-display)] text-xl font-bold">
                  Why &quot;meet in the middle&quot; is unfair
                </span>
                <span className="block max-w-[65ch] text-muted-foreground">
                  The map midpoint for Friday supper sends one friend on a {plan.midpoint.longest} minute trip.
                </span>
              </span>
              <FoldToggle />
            </summary>
            <div className="mt-4 max-w-[68ch] space-y-3 text-muted-foreground">
              <p>
                Picking a place for four to eight friends in a big city takes about 40 messages, and the same person always ends up
                organizing. Midpoint apps average the map or minimize total distance, so one friend rides 15 minutes and another rides 75.
              </p>
              <p>
                Istanbul makes it obvious: the map centre of Kadıköy, Beşiktaş, Bakırköy and Ataşehir sits on the Üsküdar shore. Great
                for the Asian side, a {plan.midpoint.longest} minute trip from Bakırköy.
              </p>
            </div>
          </details>
          <details className="group rounded-3xl border-2 border-violet px-6 py-5">
            <summary className="flex items-start justify-between gap-4">
              <span className="space-y-1">
                <span className="block font-[family-name:var(--font-display)] text-xl font-bold">Why your address stays home</span>
                <span className="block max-w-[65ch] text-muted-foreground">
                  The group lives after the # in the link, and browsers never send that part to a server.
                </span>
              </span>
              <FoldToggle />
            </summary>
            <div className="mt-4 max-w-[68ch] space-y-3 text-muted-foreground">
              <p>
                The link carries a first name, a district (plus the 5 km geohash cell of its center), diet, budget and earliest start, for
                up to eight people. No street address and no exact spot.
              </p>
              <p>
                Two things do leave the browser. The sentence you type in the agent box goes to Mesora&apos;s parse route and, when a model
                key is set, to Otari or OpenRouter. Route times come from the public OSRM server, which sees district centers and venue
                points only.
              </p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
