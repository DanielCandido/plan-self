'use client';

import { create } from 'zustand';

export type SprintModalType = 'create' | 'complete' | 'move' | 'history' | null;
export type SprintBoardTab = 'sprint' | 'backlog';

interface SprintStoreState {
  activeModal: SprintModalType;
  mobileTab: SprintBoardTab;
  focusedTaskId: string | null;
  commandOpen: boolean;
  selectedSprintId: string | null;
  setActiveModal: (modal: SprintModalType) => void;
  setMobileTab: (tab: SprintBoardTab) => void;
  setFocusedTaskId: (taskId: string | null) => void;
  setCommandOpen: (open: boolean) => void;
  setSelectedSprintId: (sprintId: string | null) => void;
}

export const useSprintStore = create<SprintStoreState>((set) => ({
  activeModal: null,
  mobileTab: 'sprint',
  focusedTaskId: null,
  commandOpen: false,
  selectedSprintId: null,
  setActiveModal: (activeModal) => set({ activeModal }),
  setMobileTab: (mobileTab) => set({ mobileTab }),
  setFocusedTaskId: (focusedTaskId) => set({ focusedTaskId }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setSelectedSprintId: (selectedSprintId) => set({ selectedSprintId }),
}));
