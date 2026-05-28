'use client';

import { create } from 'zustand';
import type { TeamModalType } from '@plan-self/types';

export type DirectoryTab = 'all' | 'byRole' | 'byTeam';

interface TeamsStoreState {
  searchTerm: string;
  filterRole: string | null;
  filterStatus: string | null;
  activeModal: TeamModalType;
  selectedTeamId: string | null;
  directoryTab: DirectoryTab;
  directoryPage: number;
  setSearchTerm: (value: string) => void;
  setFilterRole: (value: string | null) => void;
  setFilterStatus: (value: string | null) => void;
  setActiveModal: (value: TeamModalType) => void;
  setSelectedTeamId: (value: string | null) => void;
  setDirectoryTab: (value: DirectoryTab) => void;
  setDirectoryPage: (value: number) => void;
  reset: () => void;
}

const initialState = {
  searchTerm: '',
  filterRole: null,
  filterStatus: null,
  activeModal: null as TeamModalType,
  selectedTeamId: null,
  directoryTab: 'all' as DirectoryTab,
  directoryPage: 0,
};

export const useTeamsStore = create<TeamsStoreState>((set) => ({
  ...initialState,
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setFilterRole: (filterRole) => set({ filterRole }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setSelectedTeamId: (selectedTeamId) => set({ selectedTeamId }),
  setDirectoryTab: (directoryTab) => set({ directoryTab }),
  setDirectoryPage: (directoryPage) => set({ directoryPage }),
  reset: () => set(initialState),
}));
