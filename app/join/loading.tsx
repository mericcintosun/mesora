// Skeleton for a join step while the route loads. Token colors only; one slide-in.
export default function JoinLoading() {
  return (
    <div role="status" aria-label="Loading the step" className="mesora-enter space-y-10 py-10">
      <div className="flex flex-wrap gap-2">
        {["Area", "Diet", "Budget", "Time"].map((s) => (
          <span key={s} className="inline-flex rounded-full border-2 border-border px-4 py-1.5 text-sm font-semibold text-muted-foreground">
            {s}
          </span>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="h-14 w-4/5 rounded-3xl bg-secondary" />
          <div className="h-5 w-3/5 rounded-full bg-secondary" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-28 rounded-full border-2 border-border bg-card" />
            ))}
          </div>
        </div>
        <div className="h-64 rounded-3xl border-2 border-border bg-card" />
      </div>
      <span className="sr-only">Loading the step...</span>
    </div>
  );
}
