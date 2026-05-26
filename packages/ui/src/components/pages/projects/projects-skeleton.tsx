export function ProjectsSkeleton() {
  return (
    <main className="min-h-screen bg-[#0f1017] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
        <div className="h-10 w-60 rounded-lg border border-white/10 bg-white/[0.04]" />
        <div className="h-8 w-96 rounded-lg border border-white/10 bg-white/[0.04]" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-[360px] rounded-2xl border border-white/10 bg-white/[0.04]" />
          <div className="h-[360px] rounded-2xl border border-white/10 bg-white/[0.04]" />
          <div className="h-[360px] rounded-2xl border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </main>
  );
}
