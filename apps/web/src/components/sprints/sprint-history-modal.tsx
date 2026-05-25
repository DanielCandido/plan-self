'use client';

import type { SprintHistoryEntry } from '@plan-self/types';

export function SprintHistoryModal({
  open,
  onOpenChange,
  entries,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: SprintHistoryEntry[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={() => onOpenChange(false)} aria-label="Close" />
      <div className="relative z-10 w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#101118] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Sprint history</h2>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-white/70">Close</button>
        </div>
        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-10 text-center text-white/45">
              Nenhum evento auditável registrado.
            </div>
          ) : (
            entries.map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.action}</p>
                    <p className="mt-1 text-xs text-white/50">{entry.actorName ?? 'System'}</p>
                  </div>
                  <time className="text-xs text-white/45">{new Date(entry.createdAt).toLocaleString('pt-BR')}</time>
                </div>
                {entry.metadata ? (
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/20 p-3 text-xs text-white/60">{JSON.stringify(entry.metadata, null, 2)}</pre>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
