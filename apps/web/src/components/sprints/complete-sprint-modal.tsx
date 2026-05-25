'use client';

import { useState } from 'react';
import type { SprintSummary } from '@plan-self/types';

export function CompleteSprintModal({
  open,
  sprint,
  onOpenChange,
  onComplete,
  isCompleting,
}: {
  open: boolean;
  sprint: SprintSummary | null;
  onOpenChange: (open: boolean) => void;
  onComplete: (sprintId: string, notes?: string) => Promise<void>;
  isCompleting: boolean;
}) {
  const [notes, setNotes] = useState('');

  if (!open || !sprint) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={() => onOpenChange(false)} aria-label="Close" />
      <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/10 bg-[#101118] p-6">
        <h2 className="text-2xl font-semibold text-white">Complete {sprint.name}</h2>
        <p className="mt-3 text-sm text-white/55">Tasks DONE serão mantidas na sprint. Itens restantes voltam para o backlog.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="Story points" value={String(sprint.storyPoints)} />
          <Metric label="Done" value={String(sprint.completedPoints)} />
          <Metric label="Remaining" value={String(sprint.remainingPoints)} />
        </div>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Resumo da sprint / learnings"
          className="mt-5 min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-white/70">Cancel</button>
          <button
            type="button"
            disabled={isCompleting}
            onClick={async () => {
              await onComplete(sprint.id, notes || undefined);
              onOpenChange(false);
            }}
            className="rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] px-4 py-3 font-semibold text-[#140d22]"
          >
            {isCompleting ? 'Completing…' : 'Complete sprint'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
