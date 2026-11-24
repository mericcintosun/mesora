"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

// The error branch for every route without its own (`/`, `/about`, and any render
// failure under `/join` or `/result`). Shows no error message or stack: the visitor
// only needs a retry (`reset`) and a way back.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-24">
      <ErrorState
        titleAs="h1"
        title="This table did not load"
        body="Your link is safe, it lives in your address bar. Try again, or start from the home page."
        onRetry={() => reset()}
        className="mx-auto max-w-2xl"
      >
        <Button asChild variant="ghost">
          <Link href="/">Back to Mesora</Link>
        </Button>
      </ErrorState>
    </div>
  );
}
