export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#12131a] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1500px] animate-pulse space-y-4">
        <div className="h-10 rounded-lg border border-white/10 bg-white/[0.04]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="h-48 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-5" />
          <div className="h-48 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-7" />
          <div className="h-72 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-6" />
          <div className="h-72 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-6" />
          <div className="h-24 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-12" />
        </div>
      </div>
    </main>
  );
}
