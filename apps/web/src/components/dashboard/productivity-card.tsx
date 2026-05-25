'use client';

import { memo } from 'react';
import type { DashboardProductivity } from '@plan-self/types';

interface ProductivityCardProps {
  productivity: DashboardProductivity;
}

export const ProductivityCard = memo(function ProductivityCard({ productivity }: ProductivityCardProps) {
  return (
    <article className="glass-card rounded-lg border border-white/10 p-4 transition duration-200 hover:shadow-glow">
      <h2 className="text-sm font-semibold text-white">Produtividade</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <Metric title="Lead time" value={`${productivity.averageLeadTime}d`} tone="text-[#d2bbff]" />
        <Metric title="Throughput" value={`${productivity.throughput}`} tone="text-[#89ceff]" />
        <Metric title="Conclusão semanal" value={`${productivity.weeklyCompletionRate}%`} tone="text-emerald-300" />
        <Metric title="Tempo ativo hoje" value={`${productivity.activeTimeToday}h`} tone="text-amber-300" />
      </div>
    </article>
  );
});

function Metric({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.04] p-2.5">
      <p className="text-[11px] text-white/55">{title}</p>
      <p className={`mt-1 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
