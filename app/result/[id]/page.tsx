import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/result-view";
import { SceneSlot } from "@/components/scene-slot";
import { GROUPS, getGroup } from "@/lib/data";

// "live" reads the group from the link fragment in the browser; the other ids are seeded demos.
export function generateStaticParams() {
  return [...GROUPS.map((g) => ({ id: g.id })), { id: "live" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = getGroup(id);
  return { title: g ? `${g.title}: the fairest table | Mesora` : "Your group's table | Mesora" };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = getGroup(id);
  if (!group && id !== "live") notFound();

  return (
    <>
      <ResultView seeded={group ? { title: group.title, participants: group.participants } : null} />
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
          <a href="/result/sunday-brunch" className="font-semibold text-primary underline decoration-2 underline-offset-4">
            Open Sunday brunch
          </a>
        </div>
      </section>
    </>
  );
}
