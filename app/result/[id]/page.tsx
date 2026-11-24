import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/result-view";
import { SceneSlot } from "@/components/scene-slot";
import { getAdapter, solveWithFallback, type ServedPlan } from "@/lib/adapter";

// Seeded ids (friday-supper, sunday-brunch) are solved here on the server, through the
// adapter, so the first paint already carries live OSRM minutes in real mode: no seed
// flash and no client fetch. That solve must not run at build time, so this route is
// dynamic and has no generateStaticParams. "live" reads the group from the link
// fragment in the browser only; the server never sees it.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = await getAdapter().getGroup(id);
  return { title: g ? `${g.title}: the fairest table` : "Your group's table" };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adapter = getAdapter();
  const group = await adapter.getGroup(id);
  if (!group && id !== "live") notFound();

  // solveWithFallback already catches a failing real adapter. If even the seed solve
  // throws, the page still renders and ResultView shows its ErrorState with a retry.
  let served: ServedPlan | null = null;
  if (group) {
    try {
      served = await solveWithFallback(adapter, group.participants);
    } catch {
      served = null;
    }
  }

  return (
    <>
      <ResultView
        seeded={group ? { title: group.title, participants: group.participants } : null}
        initialPlan={served}
      />
      <section className="grid items-center gap-8 border-t border-border py-12 lg:grid-cols-2">
        <SceneSlot
          n={3}
          alt="A long table under neon signs at Yenikapı with four friends arriving from four directions, each holding a phone showing the same link"
          width={960}
          height={640}
          className="rounded-3xl"
        />
        <div className="space-y-3">
          <h2 className="text-2xl font-bold sm:text-3xl">Want another table?</h2>
          <p className="max-w-[60ch] text-muted-foreground">
            Sunday brunch has five people across both sides of the Bosphorus, one vegan and one on a 350 TL budget. See what the solver
            does with that.
          </p>
          <Link href="/result/sunday-brunch" className="font-semibold text-primary underline decoration-2 underline-offset-4">
            Open Sunday brunch
          </Link>
        </div>
      </section>
    </>
  );
}
