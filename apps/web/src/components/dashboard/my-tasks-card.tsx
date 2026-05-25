'use client';

import { memo } from 'react';
import type { DashboardTask, DashboardTaskState } from '@plan-self/types';

interface MyTasksCardProps {
  tasks: DashboardTask[];
  isUpdating: boolean;
  onUpdateStatus: (payload: { taskId: string; status: DashboardTaskState }) => Promise<unknown>;
}

const VISIBLE_TASKS_LIMIT = 10;

export const MyTasksCard = memo(function MyTasksCard({
  tasks,
  isUpdating,
  onUpdateStatus,
}: MyTasksCardProps) {
  return (
    <article className="glass-card rounded-lg border border-white/10 p-4 transition duration-200 hover:shadow-glow">
      <h2 className="text-sm font-semibold text-white">Minhas Tasks</h2>

      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-[#d2bbff]/65">Nenhuma task atribuída no momento.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.slice(0, VISIBLE_TASKS_LIMIT).map((task) => (
            <li key={task.id} className="rounded border border-white/10 bg-white/[0.04] p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <p className="mt-0.5 text-xs text-[#d2bbff]/65">{task.project}</p>
                  <p className="mt-1 text-[11px] text-white/50">
                    Prioridade {task.priority}
                    {task.dueDate ? ` • Vence em ${new Date(task.dueDate).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${statusClass(task.status)}`}>
                  {task.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {task.status !== 'IN_PROGRESS' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      void onUpdateStatus({ taskId: task.id, status: 'IN_PROGRESS' });
                    }}
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/80 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    Em andamento
                  </button>
                )}
                {task.status !== 'DONE' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      void onUpdateStatus({ taskId: task.id, status: 'DONE' });
                    }}
                    className="rounded border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-60"
                  >
                    Concluir
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
});

function statusClass(status: DashboardTaskState) {
  if (status === 'DONE') return 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/35';
  if (status === 'BLOCKED') return 'bg-red-400/15 text-red-300 border border-red-400/35';
  if (status === 'IN_PROGRESS') return 'bg-sky-400/15 text-sky-300 border border-sky-400/35';
  return 'bg-white/10 text-white/75 border border-white/15';
}
