'use client';

import type { SprintSummary, SprintTask } from '@plan-self/types';
import { SprintDropzone } from './sprint-dropzone';
import { SprintTaskCard } from './sprint-task-card';

export function SprintCard({
  sprint,
  selectedTaskIds,
  onSelectTask,
  onQuickEditTask,
  isDropActive,
  dropzoneId,
}: {
  sprint: SprintSummary | null;
  selectedTaskIds: string[];
  onSelectTask: (taskId: string, multi?: boolean) => void;
  onQuickEditTask: (taskId: string) => void;
  isDropActive: boolean;
  dropzoneId?: string;
}) {
  if (!sprint) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-[#101118] p-6">
        <div className="flex h-[520px] items-center justify-center rounded-[28px] border border-dashed border-white/10 text-center text-white/45">
          Crie uma sprint para começar o planejamento.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#101118] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col gap-4 border-b border-white/6 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[#d7c4ff]">⚡</span>
            <h2 className="text-2xl font-semibold tracking-tight text-white">{sprint.name}</h2>
            <span className="rounded-full bg-[#8ad4ff]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8ad4ff]">
              {sprint.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span>{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString('pt-BR') : 'Sem início'}</span>
            <span>→</span>
            <span>{sprint.endDate ? new Date(sprint.endDate).toLocaleDateString('pt-BR') : 'Sem fim'}</span>
            {sprint.goal ? <span>Goal: {sprint.goal}</span> : null}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.22em] text-white/40">Velocity</p>
          <p className="mt-2 text-2xl font-semibold text-white">{sprint.storyPoints} / {sprint.velocity || 0} pts</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#d7c4ff] to-[#8ad4ff]" style={{ width: `${Math.min(100, sprint.progress)}%` }} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric title="Capacity" value={`${sprint.capacity} pts`} />
        <Metric title="Progress" value={`${sprint.progress}%`} />
        <Metric title="Blocked" value={`${sprint.blockedPoints} pts`} />
        <Metric title="Health" value={`${sprint.healthScore}/100`} />
      </div>

      <div className="mt-6 space-y-3">
        {sprint.tasks.map((task: SprintTask) => (
          <SprintTaskCard
            key={task.id}
            task={task}
            selected={selectedTaskIds.includes(task.id)}
            onSelect={onSelectTask}
            onQuickEdit={onQuickEditTask}
          />
        ))}
        <SprintDropzone id={dropzoneId} isOver={isDropActive} />
      </div>
    </section>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-white/45">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
