export function TeamsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-xl bg-white/[0.03]" />
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl bg-white/[0.03]" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
    </div>
  );
}
