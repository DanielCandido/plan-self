'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { BoardTask } from '@plan-self/types';

export function KanbanTaskCard({ task, onOpenTask }: { task: BoardTask; onOpenTask?: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-[20px] border p-4 transition ${
        isDragging ? 'opacity-50 shadow-2xl' : 'border-white/8 bg-[#14151c] hover:border-white/15'
      }`}
      onClick={() => {
        if (!isDragging && onOpenTask) onOpenTask(task.id);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
            <span>{task.code}</span>
            {task.blocked ? (
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                BLOCKED
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium leading-snug text-white">{task.title}</p>
          {task.dueDate ? (
            <p className="text-[11px] text-white/40">
              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          {task.points !== null ? (
            <div className="rounded-xl bg-white/[0.05] px-2 py-1 text-center text-xs font-semibold text-white/75">
              {task.points}
              <span className="block text-[9px] font-medium text-white/35">PTS</span>
            </div>
          ) : null}

          <button
            type="button"
            aria-label="Arrastar task"
            className="cursor-grab rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-white/50 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <DragIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

function DragIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

