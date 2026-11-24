import { Skeleton } from "@/components/ui/states";

// Root skeleton for `/` and `/about`. Both render from seed constants and make no
// request, so this only shows during a slow route transition.
export default function RootLoading() {
  return (
    <div className="space-y-10 py-12">
      <Skeleton label="Loading Mesora" rows={2}>
        <div className="h-24 w-full max-w-4xl rounded-3xl bg-secondary" />
        <div className="h-5 w-3/5 rounded-full bg-secondary" />
        <div className="h-12 w-64 rounded-full border-2 border-border" />
      </Skeleton>
    </div>
  );
}
