'use client';

import { PageHeaderShell } from '@plan-self/ui';
import { usePrivateShell } from '@/components/layout/private-shell-context';

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
  const { toggleSidebar } = usePrivateShell();

  return (
    <PageHeaderShell
      eyebrow="Projetos"
      title={projectName}
      description="Manage your backlog, sprint planning and agile delivery."
      onToggleSidebar={toggleSidebar}
      searchSlot={
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <span className="text-white/35">⌕</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search backlog, tasks, assets..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
          />
        </div>
      }
      actions={
        <>
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
        </>
      }
      secondaryActions={
        <button
          type="button"
          onClick={onOpenCommand}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/55 hover:bg-white/[0.08]"
        >
          ⌘K command palette
        </button>
      }
    />
  );
}
