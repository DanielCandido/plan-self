'use client';

import type { ReactNode } from 'react';
import { PlanSelfLogo } from './plan-self-logo';

export interface WorkspaceNavItem {
  label: string;
  active?: boolean;
  href?: string;
}

interface WorkspaceLayoutProps {
  sidebarOpen?: boolean;
  onSidebarChange?: (open: boolean) => void;
  navItems: WorkspaceNavItem[];
  header?: ReactNode;
  children: ReactNode;
  sidebarFooter?: ReactNode;
  onNewProject?: () => void;
  sidebarClassName?: string;
  desktopSidebarVisibilityClassName?: string;
  contentOffsetClassName?: string;
  contentClassName?: string;
  mainClassName?: string;
}

export function WorkspaceLayout({
  sidebarOpen = false,
  onSidebarChange,
  navItems,
  header,
  children,
  sidebarFooter,
  onNewProject,
  sidebarClassName = 'w-64',
  desktopSidebarVisibilityClassName = 'md:block',
  contentOffsetClassName = 'md:ml-64',
  contentClassName,
  mainClassName = 'bg-[#12131a]',
}: WorkspaceLayoutProps) {
  const sidebarBody = (
    <SidebarContent
      navItems={navItems}
      footer={sidebarFooter}
      onSelect={onSidebarChange ? () => onSidebarChange(false) : undefined}
      onNewProject={onNewProject}
    />
  );

  return (
    <main className={`min-h-screen text-white ${mainClassName}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-[#12131a]/95 p-4 backdrop-blur-xl ${sidebarClassName} ${desktopSidebarVisibilityClassName}`}
      >
        {sidebarBody}
      </aside>

      {onSidebarChange && sidebarOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => onSidebarChange(false)}>
            <span className="sr-only">Fechar barra lateral</span>
          </button>
          <aside
            className={`fixed inset-y-0 left-0 z-50 border-r border-white/10 bg-[#12131a]/95 p-4 backdrop-blur-xl md:hidden ${sidebarClassName}`}
          >
            {sidebarBody}
          </aside>
        </>
      ) : null}

      <section className={`px-4 py-4 md:px-6 md:py-6 ${contentOffsetClassName} ${contentClassName ?? ''}`}>
        {header}
        {children}
      </section>
    </main>
  );
}

function SidebarContent({
  navItems,
  footer,
  onSelect,
  onNewProject,
}: {
  navItems: WorkspaceNavItem[];
  footer?: ReactNode;
  onSelect?: () => void;
  onNewProject?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-3">
        <PlanSelfLogo />
        <div>
          <p className="text-sm font-semibold text-white">Plan Self</p>
          <p className="text-xs text-white/50">Workspace</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          item.href ? (
            <a
              key={item.label}
              href={item.href}
              className={`flex w-full items-center rounded px-3 py-2 text-left text-sm transition ${
                item.active
                  ? 'border border-[#d2bbff]/25 bg-[#d2bbff]/10 text-[#d2bbff]'
                  : 'border border-transparent text-white/70 hover:border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ) : (
            <button
              key={item.label}
              type="button"
              onClick={onSelect}
              className={`flex w-full items-center rounded px-3 py-2 text-left text-sm transition ${
                item.active
                  ? 'border border-[#d2bbff]/25 bg-[#d2bbff]/10 text-[#d2bbff]'
                  : 'border border-transparent text-white/70 hover:border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          )
        ))}
      </nav>

      {onNewProject || footer ? (
        <div className="mt-auto space-y-4">
          {onNewProject ? (
            <button
              type="button"
              onClick={onNewProject}
              className="w-full rounded-md bg-[#d2bbff]/85 px-3 py-3 text-sm font-medium text-[#271a43] transition hover:bg-[#d2bbff]"
            >
              New Project
            </button>
          ) : null}
          {footer ? <div>{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
