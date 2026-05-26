'use client';

import { memo, useEffect, useState } from 'react';
import { PageHeaderShell } from '@plan-self/ui';
import { usePrivateShell } from '@/components/layout/private-shell-context';

interface DashboardHeaderProps {
  userName?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenCommand: () => void;
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
  onLogout,
  isLoggingOut,
}: DashboardHeaderProps) {
  const { toggleSidebar } = usePrivateShell();
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
    <PageHeaderShell
      eyebrow="Workspace"
      title="Dashboard"
      description={`Olá, ${userName ?? 'usuário'}. Acompanhe sprint, atividade e produtividade.`}
      onToggleSidebar={toggleSidebar}
      searchSlot={
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Buscar tasks, usuários, atividades..."
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-9 pr-14 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#d2bbff]/35 focus:bg-white/[0.08]"
          />
          <button
            type="button"
            onClick={onOpenCommand}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1 text-xs uppercase tracking-widest text-white/65 transition hover:bg-white/[0.08]"
          >
            ⌘K
          </button>
        </div>
      }
      actions={
        <button
          type="button"
          onClick={() => {
            void onLogout();
          }}
          disabled={isLoggingOut}
          className="h-11 rounded-2xl bg-[#d2bbff] px-4 text-sm font-semibold text-[#12131a] transition hover:shadow-glow disabled:opacity-60"
        >
          {isLoggingOut ? 'Saindo…' : 'Sair'}
        </button>
      }
    />
  );
});

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}
