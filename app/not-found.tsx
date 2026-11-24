import Link from "next/link";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mesora-enter space-y-6 py-20 text-center">
      <SceneSlot
        n={6}
        alt="A neon street sign outline with its arrow pointing nowhere and one acid table pin glowing further down the road"
        width={960}
        height={400}
        className="mx-auto max-w-2xl"
      />
      <h1 className="text-4xl sm:text-5xl">No table at this address</h1>
      <p className="mx-auto max-w-[50ch] text-muted-foreground">The step or group you asked for does not exist. Friday supper is always open.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back to Mesora</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/join/area">Join the plan</Link>
        </Button>
      </div>
    </div>
  );
}
