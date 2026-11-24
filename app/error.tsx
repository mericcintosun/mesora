"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Shows no error message or stack: the visitor only needs a way back.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mesora-enter space-y-6 py-24 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg font-bold">Mesora</p>
      <h1 className="text-4xl font-extrabold sm:text-5xl">This table did not load</h1>
      <p className="mx-auto max-w-[50ch] text-muted-foreground">Your link is safe, it lives in your address bar. Try again, or start from the home page.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button asChild variant="ghost">
          <Link href="/">Back to Mesora</Link>
        </Button>
      </div>
    </div>
  );
}
