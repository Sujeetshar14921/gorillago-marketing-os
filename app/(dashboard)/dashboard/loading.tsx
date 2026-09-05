export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-52 rounded-lg bg-muted/60" />
        <div className="h-4 w-80 rounded-md bg-muted/40" />
      </div>

      {/* Quick Action / Top Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-border/50 bg-card/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-muted/50" />
              <div className="h-8 w-8 rounded-lg bg-muted/40" />
            </div>
            <div className="h-6 w-24 rounded bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-xl border border-border/50 bg-card/60 p-5 lg:col-span-2 space-y-4">
          <div className="h-4 w-36 rounded bg-muted/50" />
          <div className="h-56 w-full rounded-lg bg-muted/30" />
        </div>
        <div className="h-80 rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
          <div className="h-4 w-28 rounded bg-muted/50" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
