'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DashboardSprint } from '@plan-self/types';

interface SprintCardProps {
  sprint: DashboardSprint | null;
}

export const SprintCard = memo(function SprintCard({ sprint }: SprintCardProps) {
  if (!sprint) {
    return (
      <article className="glass-card rounded-lg border border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white">Sprint Atual</h2>
        <p className="mt-3 text-sm text-[#d2bbff]/65">Nenhuma sprint ativa para esta organização.</p>
      </article>
    );
  }

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="glass-card rounded-lg border border-white/10 p-4 transition duration-200 hover:shadow-glow"
    >
      <h2 className="text-sm font-semibold text-white">Sprint Atual</h2>
      <p className="mt-1 text-sm text-[#d2bbff]/75">{sprint.name}</p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#d2bbff] to-[#89ceff]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, sprint.progress))}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/80 md:grid-cols-4">
        <Metric label="Progresso" value={`${sprint.progress}%`} />
        <Metric label="Restante" value={`${sprint.remainingDays}d`} />
        <Metric label="Concluídas" value={`${sprint.completedTasks}/${sprint.totalTasks}`} />
        <Metric label="Bloqueadas" value={`${sprint.blockedTasks}`} />
      </div>

      <p className="mt-3 text-xs text-[#89ceff]/85">Estimativa: {sprint.estimatedHours}h</p>
    </motion.article>
  );
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.04] p-2">
      <p className="text-[11px] text-white/55">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
