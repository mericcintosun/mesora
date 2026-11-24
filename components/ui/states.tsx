import * as React from "react";
import Link from "next/link";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The three named state branches every demo route uses: Skeleton (loading),
// ErrorState (failed, always with a retry) and EmptyState (nothing yet, always with a
// link to the next demo click). Same rounded 2px panel as components/ui/card.tsx,
// token colors only, static blocks, and the one mesora-slide-in entrance. No glow:
// the screen that shows a state keeps its single glow elsewhere.
const stateVariants = cva("mesora-enter rounded-3xl border-2 text-card-foreground", {
  variants: {
    tone: {
      skeleton: "border-border bg-card",
      error: "border-destructive bg-card",
      empty: "border-dashed border-border bg-card",
    },
  },
  defaultVariants: { tone: "skeleton" },
});

type HeadingTag = "h1" | "h2" | "p";

function StateTitle({ as: Tag = "h2", children }: { as?: HeadingTag; children: React.ReactNode }) {
  return <Tag className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight">{children}</Tag>;
}

/** Static placeholder bars while a route renders. No pulse, no shimmer. */
function Skeleton({
  label,
  rows = 3,
  className,
  children,
}: {
  label: string;
  rows?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={cn(stateVariants({ tone: "skeleton" }), "space-y-4 p-6", className)}>
      {children ?? (
        <>
          <div className="h-6 w-2/3 rounded-full bg-secondary" />
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className={cn("h-4 rounded-full bg-secondary", i % 2 ? "w-3/5" : "w-4/5")} />
          ))}
        </>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Something failed. Always renders a retry button bound to onRetry. */
function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = "Try again",
  pending = false,
  titleAs,
  className,
  children,
}: {
  title: string;
  body: string;
  onRetry: () => void;
  retryLabel?: string;
  pending?: boolean;
  titleAs?: HeadingTag;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div role="alert" className={cn(stateVariants({ tone: "error" }), "space-y-4 p-6", className)}>
      <StateTitle as={titleAs}>{title}</StateTitle>
      <p className="max-w-[60ch] text-sm text-muted-foreground">{body}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onRetry} disabled={pending}>
          {pending ? "Trying again..." : retryLabel}
        </Button>
        {children}
      </div>
    </div>
  );
}

/** Nothing to show yet. Always links to the next useful click. */
function EmptyState({
  title,
  body,
  href,
  cta,
  titleAs,
  className,
  art,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  titleAs?: HeadingTag;
  className?: string;
  /** Optional illustration (a SceneSlot), shown first. */
  art?: React.ReactNode;
}) {
  return (
    <div className={cn(stateVariants({ tone: "empty" }), "space-y-4 p-6", className)}>
      {art}
      <StateTitle as={titleAs}>{title}</StateTitle>
      <p className="max-w-[60ch] text-sm text-muted-foreground">{body}</p>
      <Button asChild variant="outline">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

export { Skeleton, ErrorState, EmptyState, stateVariants };
