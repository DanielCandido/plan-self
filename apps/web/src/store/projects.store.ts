'use client';

import { create } from 'zustand';

export type ProjectViewMode = 'grid' | 'list';
export type ProjectsModalType = 'create' | 'edit' | 'archive' | 'members' | null;

interface ProjectsStoreState {
  filterStatus: string | null;
  filterPriority: string | null;
  filterOwnerId: string | null;
  viewMode: ProjectViewMode;
  searchTerm: string;
  activeModal: ProjectsModalType;
  selectedProjectId: string | null;
  setFilterStatus: (value: string | null) => void;
  setFilterPriority: (value: string | null) => void;
  setFilterOwnerId: (value: string | null) => void;
  setViewMode: (value: ProjectViewMode) => void;
  setSearchTerm: (value: string) => void;
  setActiveModal: (value: ProjectsModalType) => void;
  setSelectedProjectId: (value: string | null) => void;
}

export const useProjectsStore = create<ProjectsStoreState>((set) => ({
  filterStatus: null,
  filterPriority: null,
  filterOwnerId: null,
  viewMode: 'grid',
  searchTerm: '',
  activeModal: null,
  selectedProjectId: null,
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterOwnerId: (filterOwnerId) => set({ filterOwnerId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
}));
