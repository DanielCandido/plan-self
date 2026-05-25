'use client';

import { create } from 'zustand';

interface DashboardUiState {
  searchTerm: string;
  sidebarOpen: boolean;
  commandOpen: boolean;
  setSearchTerm: (term: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
}

export const useDashboardStore = create<DashboardUiState>((set) => ({
  searchTerm: '',
  sidebarOpen: false,
  commandOpen: false,
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}));
