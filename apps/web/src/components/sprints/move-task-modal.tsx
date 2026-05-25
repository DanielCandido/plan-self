'use client';

import { useState } from 'react';
import type { SprintSummary, SprintTask } from '@plan-self/types';

export function MoveTaskModal({
  open,
  task,
  sprintOptions,
  onOpenChange,
  onMove,
  onUpdate,
  isSaving,
}: {
  open: boolean;
  task: SprintTask | null;
  sprintOptions: SprintSummary[];
  onOpenChange: (open: boolean) => void;
  onMove: (taskId: string, sprintId: string | null) => Promise<void>;
  onUpdate: (taskId: string, payload: { title?: string; priority?: string; storyPoints?: number }) => Promise<void>;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM');
  const [storyPoints, setStoryPoints] = useState(task?.storyPoints ?? 0);
  const [targetSprintId, setTargetSprintId] = useState<string | null>(task?.sprintId ?? null);

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={() => onOpenChange(false)} aria-label="Close" />
      <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/10 bg-[#101118] p-6">
        <h2 className="text-2xl font-semibold text-white">Quick edit task</h2>
        <div className="mt-4 space-y-4">
          <label className="block space-y-2 text-sm text-white/65">
            <span>Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 text-sm text-white/65">
              <span>Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="block space-y-2 text-sm text-white/65">
              <span>Story points</span>
              <input type="number" value={storyPoints} onChange={(event) => setStoryPoints(Number(event.target.value))} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" />
            </label>
          </div>
          <label className="block space-y-2 text-sm text-white/65">
            <span>Move to</span>
            <select value={targetSprintId ?? ''} onChange={(event) => setTargetSprintId(event.target.value || null)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none">
              <option value="">Backlog</option>
              {sprintOptions.filter((sprint) => sprint.status !== 'COMPLETED').map((sprint) => (
                <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-white/70">Cancel</button>
          <button
            type="button"
            disabled={isSaving}
            onClick={async () => {
              await onUpdate(task.id, { title, priority, storyPoints });
              if (targetSprintId !== task.sprintId) {
                await onMove(task.id, targetSprintId);
              }
              onOpenChange(false);
            }}
            className="rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] px-4 py-3 font-semibold text-[#140d22]"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
