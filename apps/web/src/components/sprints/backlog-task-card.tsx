'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { SprintTask } from '@plan-self/types';

export function BacklogTaskCard({
  task,
  selected,
  onSelect,
  onQuickEdit,
  onOpenTask,
}: {
  task: SprintTask;
  selected: boolean;
  onSelect: (taskId: string, multi?: boolean) => void;
  onQuickEdit: (taskId: string) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-[24px] border p-4 transition ${
        selected ? 'border-[#b794ff]/70 bg-[#1f1830]' : 'border-white/8 bg-[#14151c] hover:border-white/15'
      } ${isDragging ? 'opacity-60 shadow-2xl' : ''}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
          onSelect(task.id, true);
        } else {
          onOpenTask?.(task.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span>{task.code}</span>
            {task.epic ? <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-white/60">{task.epic.name}</span> : null}
          </div>
          <h3 className="mt-3 text-xl font-medium text-white">{task.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {task.labels.map((label) => (
              <span key={`${task.id}-${label.name}`} className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-white/65">
                {label.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-right text-sm text-white/70">
            <p className="font-semibold text-white">{task.storyPoints} pts</p>
            <p className="mt-1 text-[11px] text-white/45">{task.priority}</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickEdit(task.id);
            }}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65 hover:bg-white/[0.08]"
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/60"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            ⋮⋮
          </button>
        </div>
      </div>
    </article>
  );
}
