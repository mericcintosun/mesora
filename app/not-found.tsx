import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mesora-enter space-y-6 py-24 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg font-bold">Mesora</p>
      <h1 className="text-4xl font-extrabold sm:text-5xl">No table at this address</h1>
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
