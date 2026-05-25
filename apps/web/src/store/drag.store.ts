'use client';

import { create } from 'zustand';

interface UndoMovePayload {
  taskIds: string[];
  projectId: string;
  sourceSprintId: string | null;
  targetSprintId: string | null;
}

interface DragStoreState {
  activeTaskId: string | null;
  draggingTaskIds: string[];
  lastUndoMove: UndoMovePayload | null;
  setActiveTaskId: (taskId: string | null) => void;
  setDraggingTaskIds: (taskIds: string[]) => void;
  setLastUndoMove: (payload: UndoMovePayload | null) => void;
}

export const useDragStore = create<DragStoreState>((set) => ({
  activeTaskId: null,
  draggingTaskIds: [],
  lastUndoMove: null,
  setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
  setDraggingTaskIds: (draggingTaskIds) => set({ draggingTaskIds }),
  setLastUndoMove: (lastUndoMove) => set({ lastUndoMove }),
}));
