'use client';

import type { TeamItem } from '@plan-self/types';

export function TeamSettingsModal({
  open,
  team,
  onOpenChange,
  onArchive,
  onDelete,
}: {
  open: boolean;
  team: TeamItem | null;
  onOpenChange: (open: boolean) => void;
  onArchive: (teamId: string) => Promise<void>;
  onDelete: (teamId: string) => Promise<void>;
}) {
  if (!open || !team) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#101118] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white">Team Settings</h3>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-white/10 px-3 py-1 text-sm text-white/70">
            Esc
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-lg font-semibold text-white">General</h4>
            <p className="mt-2 text-sm text-white/65">Rename team, change slug/avatar/visibility in Edit modal.</p>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-lg font-semibold text-white">Permissions</h4>
            <p className="mt-2 text-sm text-white/65">RBAC matrix is managed in backend policies and member roles.</p>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-lg font-semibold text-white">Members</h4>
            <p className="mt-2 text-sm text-white/65">Use directory actions and invite modal to manage members.</p>
          </section>
          <section className="rounded-xl border border-rose-500/30 bg-rose-500/[0.05] p-4">
            <h4 className="text-lg font-semibold text-white">Danger Zone</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onArchive(team.id)} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80">
                {team.archivedAt ? 'Restore' : 'Archive'}
              </button>
              <button type="button" onClick={() => onDelete(team.id)} className="rounded-lg bg-rose-500/90 px-3 py-2 text-sm font-semibold text-white">
                Delete
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
