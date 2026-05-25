'use client';

import { memo } from 'react';
import type { DashboardSummary } from '@plan-self/types';

interface SummaryBarProps {
  summary: DashboardSummary;
}

export const SummaryBar = memo(function SummaryBar({ summary }: SummaryBarProps) {
  return (
    <section className="glass-card rounded-lg border border-white/10 p-4">
      <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
        <SummaryItem label="Tasks concluídas" value={`${summary.completedTasks}`} tone="text-[#d2bbff]" />
        <SummaryItem label="Eficiência" value={`${summary.efficiency}%`} tone="text-emerald-300" />
        <SummaryItem label="Usuários ativos" value={`${summary.activeUsers}`} tone="text-[#89ceff]" />
      </div>
    </section>
  );
});

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[11px] text-white/55">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
