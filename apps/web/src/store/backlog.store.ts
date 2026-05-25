'use client';

import { create } from 'zustand';

export interface BacklogFilters {
  search: string;
  priority: string | null;
  epicId: string | null;
  assigneeId: string | null;
  sortBy: 'sortOrder' | 'priority' | 'storyPoints' | 'updatedAt' | 'title';
  order: 'asc' | 'desc';
}

interface BacklogStoreState extends BacklogFilters {
  collapsedEpics: Record<string, boolean>;
  selectedTaskIds: string[];
  setSearch: (search: string) => void;
  setPriority: (priority: string | null) => void;
  setEpicId: (epicId: string | null) => void;
  setAssigneeId: (assigneeId: string | null) => void;
  setSortBy: (sortBy: BacklogFilters['sortBy']) => void;
  setOrder: (order: BacklogFilters['order']) => void;
  toggleEpic: (epicId: string) => void;
  setSelectedTaskIds: (taskIds: string[]) => void;
  toggleTaskSelection: (taskId: string, multi?: boolean) => void;
  clearSelection: () => void;
}

export const useBacklogStore = create<BacklogStoreState>((set) => ({
  search: '',
  priority: null,
  epicId: null,
  assigneeId: null,
  sortBy: 'sortOrder',
  order: 'asc',
  collapsedEpics: {},
  selectedTaskIds: [],
  setSearch: (search) => set({ search }),
  setPriority: (priority) => set({ priority }),
  setEpicId: (epicId) => set({ epicId }),
  setAssigneeId: (assigneeId) => set({ assigneeId }),
  setSortBy: (sortBy) => set({ sortBy }),
  setOrder: (order) => set({ order }),
  toggleEpic: (epicId) =>
    set((state) => ({
      collapsedEpics: { ...state.collapsedEpics, [epicId]: !state.collapsedEpics[epicId] },
    })),
  setSelectedTaskIds: (selectedTaskIds) => set({ selectedTaskIds }),
  toggleTaskSelection: (taskId, multi = false) =>
    set((state) => {
      if (!multi) {
        return {
          selectedTaskIds: state.selectedTaskIds.includes(taskId) ? [] : [taskId],
        };
      }

      return {
        selectedTaskIds: state.selectedTaskIds.includes(taskId)
          ? state.selectedTaskIds.filter((id) => id !== taskId)
          : [...state.selectedTaskIds, taskId],
      };
    }),
  clearSelection: () => set({ selectedTaskIds: [] }),
}));
