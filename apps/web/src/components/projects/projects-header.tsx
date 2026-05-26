'use client';

import { PageHeaderShell } from '@plan-self/ui';
import { usePrivateShell } from '@/components/layout/private-shell-context';

export function ProjectsHeader({
  searchTerm,
  onSearchChange,
  onClear,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}) {
  const { toggleSidebar } = usePrivateShell();

  return (
    <PageHeaderShell
      eyebrow="Workspace"
      title="Projects"
      description="Overview of all active organizational initiatives and their current trajectory."
      onToggleSidebar={toggleSidebar}
      searchSlot={
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects, files..."
          className="h-12 w-full max-w-[640px] rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white/85 outline-none transition focus:border-[#d2bbff]/35 focus:bg-white/[0.08]"
        />
      }
      actions={
        <button
          type="button"
          className="rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white/80"
          onClick={onClear}
        >
          Clear
        </button>
      }
    />
  );
}
