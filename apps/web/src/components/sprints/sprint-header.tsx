'use client';

interface SprintHeaderProps {
  projectName: string;
  backlogCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenCreateSprint: () => void;
  onOpenHistory: () => void;
  onOpenCommand: () => void;
}

export function SprintHeader({
  projectName,
  backlogCount,
  search,
  onSearchChange,
  onOpenCreateSprint,
  onOpenHistory,
  onOpenCommand,
}: SprintHeaderProps) {
  return (
    <header className="mb-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#111219] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-4 border-b border-white/6 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9b2ff] to-[#8b5cf6] text-[#1a112d] shadow-[0_10px_30px_rgba(139,92,246,0.4)] md:flex">
            ◆
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Projetos</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{projectName}</h1>
            <p className="mt-1 text-sm text-white/55">Manage your backlog, sprint planning and agile delivery.</p>
          </div>
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
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <span className="text-white/35">⌕</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search backlog, tasks, assets..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onOpenCommand}
          className="self-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/55 hover:bg-white/[0.08] lg:self-auto"
        >
          ⌘K command palette
        </button>
      </div>
    </header>
  );
}
