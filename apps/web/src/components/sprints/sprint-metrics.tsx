'use client';

import type { BurndownPoint, SprintMetricSnapshot } from '@plan-self/types';
import { BurndownChart } from './burndown-chart';
import { CapacityWidget } from './capacity-widget';
import { SprintHealthWidget } from './sprint-health-widget';
import { VelocityChart } from './velocity-chart';

export function SprintMetrics({
  sprint,
  metrics,
  burndown,
  velocityTrend,
}: {
  sprint: {
    capacity: number;
    storyPoints: number;
    healthScore: number;
    blockedPoints: number;
    completedPoints: number;
    remainingPoints: number;
    progress: number;
  } | null;
  metrics: SprintMetricSnapshot[];
  burndown: BurndownPoint[];
  velocityTrend: Array<{ sprintId: string; name: string; velocity: number; completedPoints: number }>;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <VelocityChart items={velocityTrend} />
      <BurndownChart items={burndown} />
      <CapacityWidget capacity={sprint?.capacity ?? 0} storyPoints={sprint?.storyPoints ?? 0} />
      <SprintHealthWidget healthScore={sprint?.healthScore ?? 0} />
      <div className="rounded-3xl border border-white/10 bg-[#15161d] p-4 xl:col-span-2">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Live metrics</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <MetricCard label="Progresso" value={`${sprint?.progress ?? 0}%`} />
          <MetricCard label="Concluído" value={`${sprint?.completedPoints ?? 0} pts`} />
          <MetricCard label="Restante" value={`${sprint?.remainingPoints ?? 0} pts`} />
          <MetricCard label="Bloqueado" value={`${sprint?.blockedPoints ?? 0} pts`} />
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-3 text-xs text-white/55">
          {metrics.length} snapshots capturados para esta sprint.
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
