'use client';

export function CapacityWidget({ capacity, storyPoints }: { capacity: number; storyPoints: number }) {
  const usage = capacity > 0 ? Math.min(100, Math.round((storyPoints / capacity) * 100)) : 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#15161d] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">Capacity</p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold text-white">{usage}%</p>
          <p className="text-sm text-white/55">{storyPoints} / {capacity || 0} pts</p>
        </div>
        <div className="rounded-2xl bg-white/[0.05] px-3 py-2 text-xs text-white/60">Utilização</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#8ad4ff] to-[#8b5cf6]" style={{ width: `${usage}%` }} />
      </div>
    </div>
  );
}
