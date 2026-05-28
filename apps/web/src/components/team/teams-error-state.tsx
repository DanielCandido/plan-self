export function TeamsErrorState() {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-8 text-center">
      <h2 className="text-2xl font-semibold text-white">Failed to load team data</h2>
      <p className="mt-2 text-white/65">Please refresh and try again.</p>
    </div>
  );
}
