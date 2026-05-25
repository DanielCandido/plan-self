'use client';

import type { BurndownPoint } from '@plan-self/types';

export function BurndownChart({ items }: { items: BurndownPoint[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#15161d] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Burndown</p>
        <div className="mt-4 flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/40">
          Sem snapshots da sprint.
        </div>
      </div>
    );
  }

  const maxPoints = Math.max(1, ...items.map((item) => item.remainingPoints));
  const points = items
    .map((item, index) => {
      const x = items.length === 1 ? 12 : 12 + (index / (items.length - 1)) * 276;
      const y = 108 - (item.remainingPoints / maxPoints) * 84;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-3xl border border-white/10 bg-[#15161d] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Burndown</p>
          <h3 className="text-sm font-semibold text-white">Queima diária de pontos</h3>
        </div>
      </div>
      <svg viewBox="0 0 300 120" className="h-40 w-full">
        <path d="M12 12v96h276" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="#b794ff" strokeWidth="3" strokeLinecap="round" />
        {items.map((item, index) => {
          const x = items.length === 1 ? 12 : 12 + (index / (items.length - 1)) * 276;
          const y = 108 - (item.remainingPoints / maxPoints) * 84;
          return (
            <g key={item.id}>
              <circle cx={x} cy={y} r="4" fill="#8b5cf6" />
              <text x={x} y="116" textAnchor="middle" className="fill-white/55 text-[8px]">
                {new Date(item.snapshotDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
