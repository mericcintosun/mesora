import { Skeleton } from "@/components/ui/states";

// Skeleton for the result page while the server solves the table (one OSRM request at
// most in real mode). Static blocks, one slide-in.
export default function ResultLoading() {
  return (
    <div className="space-y-12 py-10">
      <Skeleton label="Solving the table">
        <div className="h-4 w-48 rounded-full bg-secondary" />
        <div className="h-16 w-full max-w-2xl rounded-3xl bg-secondary" />
        <div className="h-5 w-4/5 max-w-xl rounded-full bg-secondary" />
        <div className="h-12 w-56 rounded-full border-2 border-border" />
      </Skeleton>
      <Skeleton label="Loading the trip per person">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <div className="h-4 rounded-full bg-secondary" />
            <div className="space-y-2">
              <div className="h-3 w-1/2 rounded-full bg-primary/40" />
              <div className="h-3 w-4/5 rounded-full bg-violet/40" />
            </div>
          </div>
        ))}
      </Skeleton>
    </div>
  );
}
