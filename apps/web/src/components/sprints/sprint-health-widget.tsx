'use client';

export function SprintHealthWidget({ healthScore }: { healthScore: number }) {
  const state = healthScore >= 80 ? 'Ótima' : healthScore >= 60 ? 'Atenção' : 'Crítica';
  const color = healthScore >= 80 ? 'text-emerald-300' : healthScore >= 60 ? 'text-amber-300' : 'text-rose-300';

  return (
    <div className="rounded-3xl border border-white/10 bg-[#15161d] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">Health score</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl font-semibold text-white">
          {healthScore}
        </div>
        <div>
          <p className={`text-lg font-semibold ${color}`}>{state}</p>
          <p className="text-sm text-white/55">Bloqueios, atraso e carga avaliados em tempo real.</p>
        </div>
      </div>
    </div>
  );
}
