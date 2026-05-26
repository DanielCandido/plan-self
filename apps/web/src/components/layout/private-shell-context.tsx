'use client';

import { createContext, useContext } from 'react';

interface PrivateShellContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const PrivateShellContext = createContext<PrivateShellContextValue | null>(null);

export function PrivateShellProvider({
  value,
  children,
}: {
  value: PrivateShellContextValue;
  children: React.ReactNode;
}) {
  return <PrivateShellContext.Provider value={value}>{children}</PrivateShellContext.Provider>;
}

export function usePrivateShell() {
  const context = useContext(PrivateShellContext);
  if (!context) {
    throw new Error('usePrivateShell must be used within PrivateShellProvider');
  }
  return context;
}
