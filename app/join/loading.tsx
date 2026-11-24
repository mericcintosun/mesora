import { Skeleton } from "@/components/ui/states";

// Skeleton for a join step while the route loads. Static blocks, one slide-in.
export default function JoinLoading() {
  return (
    <div className="space-y-10 py-10">
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {["Area", "Diet", "Budget", "Time"].map((s) => (
          <span key={s} className="inline-flex rounded-full border-2 border-border px-4 py-1.5 text-sm font-semibold text-muted-foreground">
            {s}
          </span>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton label="Loading the step" rows={4} />
        <Skeleton label="Loading the live preview" rows={3} className="min-h-64" />
      </div>
    </div>
  );
}
