'use client';

import { memo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface DashboardShellProps {
  sidebarOpen: boolean;
  onSidebarChange: (open: boolean) => void;
  header: ReactNode;
  children: ReactNode;
}

const NAV_ITEMS = ['Dashboard', 'Projects', 'Sprints', 'Reports', 'Settings'];

export const DashboardShell = memo(function DashboardShell({
  sidebarOpen,
  onSidebarChange,
  header,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-[#12131a] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-[#12131a]/95 p-4 backdrop-blur-xl md:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onSidebarChange(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#12131a]/95 p-4 backdrop-blur-xl md:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            >
              <SidebarContent onSelect={() => onSidebarChange(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="px-4 py-4 md:ml-64 md:px-6 md:py-6">
        {header}
        {children}
      </section>
    </main>
  );
});

function SidebarContent({ onSelect }: { onSelect?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d2bbff]/50">Plan Self</p>
        <p className="mt-1 text-sm font-semibold text-white">Precision Minimalism</p>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={onSelect}
            className={`flex w-full items-center rounded px-3 py-2 text-left text-sm transition ${
              index === 0
                ? 'border border-[#d2bbff]/25 bg-[#d2bbff]/10 text-[#d2bbff]'
                : 'border border-transparent text-white/70 hover:border-white/10 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <p className="text-xs text-white/60">Modo escuro ativo</p>
        <p className="mt-1 text-xs text-[#89ceff]/85">Realtime conectado</p>
      </div>
    </div>
  );
}
