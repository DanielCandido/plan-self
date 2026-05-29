'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjectById } from '@/hooks/use-projects';
import { usePrivateShell } from '@/components/layout/private-shell-context';

const tabs = [
  { label: 'Sprints', slug: 'sprints' },
  { label: 'Kanban', slug: 'kanban' },
] as const;

export function ProjectWorkspaceHeader({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const { toggleSidebar } = usePrivateShell();
  const { data: project, isLoading } = useProjectById(projectId);

  return (
    <header className="mb-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#111219] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-start gap-3 border-b border-white/6 px-5 py-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 transition hover:bg-white/[0.08] xl:hidden"
          aria-label="Abrir menu"
        >
          <MenuIcon />
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Projetos</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {isLoading ? (
              <span className="inline-block h-8 w-48 animate-pulse rounded-xl bg-white/[0.06]" />
            ) : (
              (project?.name ?? 'Project')
            )}
          </h1>
        </div>
      </div>

      <nav className="flex items-center gap-1 px-5 py-3" aria-label="Workspace tabs">
        {tabs.map((tab) => {
          const href = `/projects/${projectId}/${tab.slug}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={tab.slug}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#8b5cf6]/20 text-[#d2bbff]'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
