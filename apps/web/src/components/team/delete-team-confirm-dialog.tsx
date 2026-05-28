'use client';

import { useState } from 'react';
import type { TeamItem } from '@plan-self/types';

export function DeleteTeamConfirmDialog({
  open,
  team,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  team: TeamItem | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (teamId: string) => Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState('');
  if (!open || !team) return null;

  const canDelete = confirmation === team.name;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-rose-500/30 bg-[#101118] p-6">
        <h3 className="text-2xl font-semibold text-white">Delete Team</h3>
        <p className="mt-2 text-sm text-white/65">
          Type <span className="font-semibold text-white">{team.name}</span> to confirm permanent archive/delete.
        </p>
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
          placeholder={team.name}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDelete || isDeleting}
            onClick={async () => {
              await onConfirm(team.id);
              setConfirmation('');
              onOpenChange(false);
            }}
            className="rounded-lg bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
