'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardColumn, BoardTask } from '@plan-self/types';
import { KanbanTaskCard } from './kanban-task-card';

const COLUMN_TYPE_COLORS: Record<string, string> = {
  BACKLOG: 'text-white/50 border-white/10',
  TODO: 'text-[#8ad4ff] border-[#8ad4ff]/25',
  IN_PROGRESS: 'text-[#d7c4ff] border-[#d7c4ff]/25',
  REVIEW: 'text-amber-300 border-amber-300/25',
  DONE: 'text-emerald-400 border-emerald-400/25',
  BLOCKED: 'text-rose-400 border-rose-400/25',
};

export function KanbanColumnPanel({
  column,
  tasks,
  isOver,
  onOpenTask,
}: {
  column: BoardColumn;
  tasks: BoardTask[];
  isOver: boolean;
  onOpenTask?: (taskId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  const colorClass = COLUMN_TYPE_COLORS[column.type] ?? 'text-white/50 border-white/10';
  const isAtWipLimit = column.wipLimit !== null && tasks.length >= column.wipLimit;

  return (
    <section
      className={`flex w-72 flex-shrink-0 flex-col rounded-[28px] border transition ${
        isOver ? 'border-[#8b5cf6]/50 bg-[#1c1630]' : 'border-white/10 bg-[#101118]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${colorClass.split(' ')[0]}`}>
            {column.name}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${colorClass} ${
              isAtWipLimit ? 'bg-rose-500/10 text-rose-300 border-rose-400/30' : ''
            }`}
          >
            {tasks.length}
            {column.wipLimit !== null ? `/${column.wipLimit}` : ''}
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <KanbanTaskCard key={task.id} task={task} onOpenTask={onOpenTask} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 ? (
          <div
            className={`flex h-24 items-center justify-center rounded-2xl border border-dashed ${
              isOver ? 'border-[#8b5cf6]/60 bg-[#8b5cf6]/5' : 'border-white/8'
            } text-xs text-white/30`}
          >
            {isOver ? 'Soltar aqui' : 'Sem tasks'}
          </div>
        ) : null}
      </div>
    </section>
  );
}
