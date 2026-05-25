export function SprintSkeleton() {
  return (
    <main className="min-h-screen bg-[#111218] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1600px] animate-pulse space-y-4">
        <div className="h-14 rounded-2xl border border-white/10 bg-white/[0.04]" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="h-[720px] rounded-[28px] border border-white/10 bg-white/[0.04]" />
          <div className="h-[720px] rounded-[28px] border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </main>
  );
}
