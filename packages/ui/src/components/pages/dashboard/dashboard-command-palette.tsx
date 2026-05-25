'use client';

import { useEffect } from 'react';

export function DashboardCommandPalette({
  open,
  onOpenChange,
  searchTerm,
  onSearchChange,
  taskTitles,
  activityTitles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  taskTitles: string[];
  activityTitles: string[];
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-20 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={() => onOpenChange(false)}>
        <span className="sr-only">Fechar paleta de comandos</span>
      </button>
      <div className="relative z-10 w-full max-w-xl rounded-lg border border-white/10 bg-[#161823]/95 p-3 shadow-glow">
        <div className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-2">
          <span className="text-xs text-[#d2bbff]/60">⌘K</span>
          <input
            autoFocus
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar..."
            className="h-10 w-full bg-transparent text-sm text-white placeholder:text-[#d2bbff]/35 outline-none"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70"
          >
            Esc
          </button>
        </div>

        <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
          <CommandSection title="Tasks" items={taskTitles} />
          <CommandSection title="Atividades" items={activityTitles} />
        </div>
      </div>
    </div>
  );
}

function CommandSection({ title, items }: { title: string; items: string[] }) {
  const visible = items.filter(Boolean).slice(0, 8);

  return (
    <section>
      <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-[#d2bbff]/45">{title}</p>
      {visible.length === 0 ? (
        <p className="rounded border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/45">Sem resultados.</p>
      ) : (
        <ul className="space-y-1">
          {visible.map((item) => (
            <li key={`${title}-${item}`} className="rounded border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/80">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
