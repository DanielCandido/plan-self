'use client';

import type { ReactNode } from 'react';

interface PageHeaderShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  searchSlot?: ReactNode;
  secondaryActions?: ReactNode;
  onToggleSidebar?: () => void;
}

export function PageHeaderShell({
  eyebrow,
  title,
  description,
  actions,
  searchSlot,
  secondaryActions,
  onToggleSidebar,
}: PageHeaderShellProps) {
  return (
    <header className="mb-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#111219] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-4 border-b border-white/6 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          {onToggleSidebar ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 transition hover:bg-white/[0.08] xl:hidden"
              aria-label="Abrir menu"
            >
              <MenuIcon />
            </button>
          ) : null}
          <div>
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">{eyebrow}</p>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
            {description ? <p className="mt-1 text-sm text-white/55">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>

      {searchSlot || secondaryActions ? (
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">{searchSlot}</div>
          {secondaryActions ? <div className="flex items-center gap-2">{secondaryActions}</div> : null}
        </div>
      ) : null}
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
