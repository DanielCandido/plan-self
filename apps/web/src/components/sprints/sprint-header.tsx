'use client';

interface SprintHeaderProps {
  backlogCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenCreateSprint: () => void;
  onOpenHistory: () => void;
  onOpenCommand: () => void;
}

export function SprintHeader({
  backlogCount,
  search,
  onSearchChange,
  onOpenCreateSprint,
  onOpenHistory,
  onOpenCommand,
}: SprintHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <span className="text-white/35">⌕</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search backlog, tasks, assets..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
          <span>{backlogCount} itens no backlog</span>
        </div>
        <button
          type="button"
          onClick={onOpenHistory}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]"
        >
          Sprint history
        </button>
        <button
          type="button"
          onClick={onOpenCreateSprint}
          className="rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] px-5 py-3 text-sm font-semibold text-[#140d22] shadow-[0_12px_30px_rgba(139,92,246,0.35)] transition hover:translate-y-[-1px]"
        >
          + New Sprint
        </button>
        <button
          type="button"
          onClick={onOpenCommand}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/55 hover:bg-white/[0.08]"
        >
          ⌘K command palette
        </button>
      </div>
    </div>
  );
}

