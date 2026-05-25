'use client';

export function VelocityChart({
  items,
}: {
  items: Array<{ sprintId: string; name: string; velocity: number; completedPoints: number }>;
}) {
  const max = Math.max(1, ...items.map((item) => Math.max(item.velocity, item.completedPoints)));

  return (
    <div className="rounded-3xl border border-white/10 bg-[#15161d] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Velocity</p>
          <h3 className="text-sm font-semibold text-white">Tendência das últimas sprints</h3>
        </div>
      </div>
      <div className="flex h-40 items-end gap-3">
        {items.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/40">
            Sem histórico suficiente.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.sprintId} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end gap-1">
                <div
                  className="w-1/2 rounded-t-xl bg-[#8ad4ff]/70"
                  style={{ height: `${(item.velocity / max) * 100}%` }}
                />
                <div
                  className="w-1/2 rounded-t-xl bg-gradient-to-t from-[#8b5cf6] to-[#d8c7ff]"
                  style={{ height: `${(item.completedPoints / max) * 100}%` }}
                />
              </div>
              <div className="text-center text-[11px] text-white/55">
                <p className="font-medium text-white/80">{item.name}</p>
                <p>{item.completedPoints} pts</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
