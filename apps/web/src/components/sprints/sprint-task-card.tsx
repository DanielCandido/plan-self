'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { SprintTask } from '@plan-self/types';

export function SprintTaskCard({
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
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-white/45">
            <span>{task.code}</span>
            <PriorityBadge priority={task.priority} />
            {task.isBlocked ? <span className="rounded-full bg-rose-500/15 px-2 py-1 text-[11px] text-rose-200">BLOCKED</span> : null}
          </div>
          <div>
            <h3 className="text-xl font-medium text-white">{task.title}</h3>
            {task.description ? <p className="mt-1 text-sm text-white/50">{task.description}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {task.labels.map((label) => (
              <span key={`${task.id}-${label.name}`} className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-white/65">
                {label.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickEdit(task.id);
            }}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65 hover:bg-white/[0.08]"
          >
            Quick edit
          </button>
          <div className="min-w-14 rounded-2xl bg-white/[0.05] px-3 py-2 text-center text-sm font-semibold text-white/85">
            {task.storyPoints}
            <p className="text-xs font-medium text-white/45">PTS</p>
          </div>
          <button
            type="button"
            aria-label="Drag task"
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

function PriorityBadge({ priority }: { priority: string }) {
  const theme =
    priority === 'URGENT'
      ? 'bg-rose-500/15 text-rose-200'
      : priority === 'HIGH'
        ? 'bg-amber-500/15 text-amber-200'
        : 'bg-[#8ad4ff]/15 text-[#9dddff]';

  return <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${theme}`}>{priority}</span>;
}
