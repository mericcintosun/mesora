// Skeleton for the result page while the solve renders. Token colors only; one slide-in.
export default function ResultLoading() {
  return (
    <div role="status" aria-label="Loading the table" className="mesora-enter space-y-12 py-10">
      <div className="space-y-4">
        <div className="h-4 w-48 rounded-full bg-secondary" />
        <div className="h-16 w-full max-w-2xl rounded-3xl bg-secondary" />
        <div className="h-5 w-4/5 max-w-xl rounded-full bg-secondary" />
        <div className="h-12 w-56 rounded-full border-2 border-border" />
      </div>
      <div className="space-y-5 rounded-3xl border-2 border-border bg-card p-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <div className="h-4 rounded-full bg-secondary" />
            <div className="space-y-2">
              <div className="h-3 w-1/2 rounded-full bg-primary/40" />
              <div className="h-3 w-4/5 rounded-full bg-violet/40" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Solving the table...</span>
    </div>
  );
}
