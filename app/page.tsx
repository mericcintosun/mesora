import type { Metadata } from "next";
import Link from "next/link";
import { FairnessScene } from "@/components/fairness-scene";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";
import { getAdapter } from "@/lib/adapter";
import { solvePlan } from "@/lib/solver";

export const metadata: Metadata = { title: "Meet where nobody rides an hour" };

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
      <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-center gap-10 py-12">
        <h1 className="mesora-enter text-display font-extrabold">
          Meet where nobody rides an hour.
        </h1>
        <div className="mesora-stagger flex flex-col gap-6">
          <p className="max-w-[60ch] text-lg text-muted-foreground sm:text-xl">
            For whoever organizes dinner for four to eight friends: send one link. Each friend adds their district, diet, budget and
            start time, and Mesora picks the table where the longest trip is shortest. The group lives in the link, not on our server.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="mesora-glow">
              <Link href="/join/area">Add yourself to Friday supper</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/result/friday-supper">See Friday&apos;s table</Link>
            </Button>
          </div>
        </div>
        <SceneSlot
          n={1}
          alt="Night map of Istanbul with four neon route lines from Kadıköy, Beşiktaş, Bakırköy and Ataşehir meeting at one glowing table in Yenikapı"
          width={1440}
          height={360}
          className="max-h-[28vh] rounded-3xl object-cover"
        />
      </section>

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

      <section className="grid gap-10 border-t border-border py-16 lg:grid-cols-2">
        <details className="group rounded-3xl border-2 border-border bg-card p-6">
          <summary className="flex items-center justify-between gap-4 font-[family-name:var(--font-display)] text-xl font-bold">
            Why &quot;meet in the middle&quot; is unfair
            <span className="rounded-full border-2 border-border px-3 text-sm group-open:border-primary">more</span>
          </summary>
          <div className="mt-4 max-w-[68ch] space-y-3 text-muted-foreground">
            <p>
              Picking a place for four to eight friends in a big city takes about 40 messages, and the same person always ends up
              organizing. Midpoint apps average the map or minimize total distance, so one friend rides 15 minutes and another rides 75.
            </p>
            <p>
              Istanbul makes it obvious: the map centre of Kadıköy, Beşiktaş, Bakırköy and Ataşehir sits on the Üsküdar shore. Great
              for the Asian side, a 74 minute trip from Bakırköy.
            </p>
          </div>
        </details>
        <details className="group rounded-3xl border-2 border-border bg-card p-6">
          <summary className="flex items-center justify-between gap-4 font-[family-name:var(--font-display)] text-xl font-bold">
            Why your address stays home
            <span className="rounded-full border-2 border-border px-3 text-sm group-open:border-primary">more</span>
          </summary>
          <div className="mt-4 max-w-[68ch] space-y-3 text-muted-foreground">
            <p>
              The group lives after the # in the link. Browsers never send that part to a server, so Mesora&apos;s host never sees who is
              coming or where from.
            </p>
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
      </section>
    </>
  );
}
