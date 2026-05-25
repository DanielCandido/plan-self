'use client';

import { memo, useEffect, useState } from 'react';

interface DashboardHeaderProps {
  userName?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenCommand: () => void;
  onToggleSidebar: () => void;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
}

// Tuned for quick perceived feedback while avoiding excessive query churn.
const SEARCH_DEBOUNCE_MS = 240;

export const DashboardHeader = memo(function DashboardHeader({
  userName,
  searchTerm,
  onSearchChange,
  onOpenCommand,
  onToggleSidebar,
  onLogout,
  isLoggingOut,
}: DashboardHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenCommand();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenCommand]);

  return (
    <header className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 md:hidden"
          aria-label="Abrir menu"
        >
          <MenuIcon />
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white md:text-xl">Dashboard</h1>
          <p className="text-xs text-[#d2bbff]/60 md:text-sm">
            Olá, {userName ?? 'usuário'}. Acompanhe sprint, atividade e produtividade.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 md:w-80 md:flex-none">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d2bbff]/40" />
          <input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Buscar tasks, usuários, atividades..."
            className="h-9 w-full rounded border border-white/10 bg-white/5 pl-9 pr-14 text-sm text-white placeholder:text-[#d2bbff]/35 outline-none transition focus:border-[#d2bbff]/35 focus:bg-white/10"
          />
          <button
            type="button"
            onClick={onOpenCommand}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[#d2bbff]/65 transition hover:bg-white/10"
          >
            ⌘K
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            void onLogout();
          }}
          disabled={isLoggingOut}
          className="h-9 rounded bg-[#d2bbff] px-3 text-xs font-semibold text-[#12131a] transition hover:shadow-glow disabled:opacity-60"
        >
          {isLoggingOut ? 'Saindo…' : 'Sair'}
        </button>
      </div>
    </header>
  );
});

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}
