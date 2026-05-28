export function KanbanSkeleton() {
  return (
    <main className="min-h-screen bg-[#111218] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1600px] animate-pulse space-y-4">
        <div className="h-14 rounded-2xl border border-white/10 bg-white/[0.04]" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[600px] w-72 flex-shrink-0 rounded-[28px] border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
