'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { BoardTask, KanbanBoardResponse, MoveBoardTaskPayload, ReorderBoardTaskPayload } from '@plan-self/types';
import apiClient, { getAccessToken } from '@/lib/api';

const boardQueryKey = (projectId: string) => ['kanban', 'board', projectId] as const;

// ── WebSocket event payloads ──────────────────────────────────────────────────

interface KanbanSnapshotPayload {
  projectId: string;
  timestamp: string;
  board: KanbanBoardResponse;
}

interface KanbanTaskMovedPayload {
  projectId: string;
  taskId: string;
  fromColumnId: string | null;
  toColumnId: string;
  targetPosition: number;
  status: string;
  timestamp: string;
}

interface KanbanTaskReorderedPayload {
  projectId: string;
  columnId: string;
  orderedTaskIds: string[];
  timestamp: string;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

function applyTaskMoved(
  prev: KanbanBoardResponse,
  payload: KanbanTaskMovedPayload,
): KanbanBoardResponse {
  const tasks = prev.tasks.map((task) => {
    if (task.id !== payload.taskId) return task;
    return {
      ...task,
      boardColumnId: payload.toColumnId,
      status: payload.status,
      state: payload.status,
      position: payload.targetPosition,
    };
  });
  return { ...prev, tasks };
}

function applyTaskReordered(
  prev: KanbanBoardResponse,
  payload: KanbanTaskReorderedPayload,
): KanbanBoardResponse {
  const positionMap = new Map(payload.orderedTaskIds.map((id, idx) => [id, idx]));
  const tasks = prev.tasks.map((task) => {
    const newPosition = positionMap.get(task.id);
    if (newPosition === undefined) return task;
    return { ...task, position: newPosition };
  });
  return { ...prev, tasks };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKanbanBoard(projectId: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const board = useQuery({
    queryKey: boardQueryKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<KanbanBoardResponse>(`/boards/${projectId}`);
      return data;
    },
    staleTime: 30_000,
  });

  const invalidateBoard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
  }, [projectId, queryClient]);

  const moveTask = useMutation({
    mutationFn: async (payload: MoveBoardTaskPayload) => {
      await apiClient.patch('/boards/tasks/move', payload);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Falha ao mover task';
      toast.error(message);
      invalidateBoard();
    },
  });

  const reorderTasks = useMutation({
    mutationFn: async (payload: ReorderBoardTaskPayload) => {
      await apiClient.patch('/boards/tasks/reorder', payload);
    },
    onError: () => {
      toast.error('Falha ao reordenar tasks');
      invalidateBoard();
    },
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:3010';
    const socket: Socket = io(`${gatewayUrl}/events`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
    });
    socketRef.current = socket;

    const requestSnapshot = () => {
      socket.emit('kanban:sync.request', { projectId: projectIdRef.current });
    };

    socket.on('connect', () => {
      socket.emit('project:subscribe', { projectId: projectIdRef.current });
      requestSnapshot();
    });

    socket.on('reconnect', () => {
      socket.emit('project:subscribe', { projectId: projectIdRef.current });
      requestSnapshot();
    });

    socket.on('kanban.snapshot', (payload: KanbanSnapshotPayload) => {
      if (payload.projectId !== projectIdRef.current) return;
      queryClient.setQueryData(boardQueryKey(payload.projectId), payload.board);
    });

    socket.on('kanban.task.moved', (payload: KanbanTaskMovedPayload) => {
      if (payload.projectId !== projectIdRef.current) return;
      queryClient.setQueryData(
        boardQueryKey(payload.projectId),
        (prev: KanbanBoardResponse | undefined) => {
          if (!prev) return prev;
          return applyTaskMoved(prev, payload);
        },
      );
    });

    socket.on('kanban.task.reordered', (payload: KanbanTaskReorderedPayload) => {
      if (payload.projectId !== projectIdRef.current) return;
      queryClient.setQueryData(
        boardQueryKey(payload.projectId),
        (prev: KanbanBoardResponse | undefined) => {
          if (!prev) return prev;
          return applyTaskReordered(prev, payload);
        },
      );
    });

    socket.on('connect_error', () => {
      invalidateBoard();
    });

    return () => {
      socket.emit('project:unsubscribe', { projectId: projectIdRef.current });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, queryClient, invalidateBoard]);

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, BoardTask[]>();

    if (!board.data) return map;

    for (const column of board.data.columns) {
      map.set(column.id, []);
    }

    const sorted = [...board.data.tasks].sort((a, b) => a.position - b.position);

    for (const task of sorted) {
      if (task.boardColumnId) {
        const list = map.get(task.boardColumnId) ?? [];
        list.push(task);
        map.set(task.boardColumnId, list);
      }
    }

    return map;
  }, [board.data]);

  return {
    board: board.data,
    tasksByColumn,
    isBoardLoading: board.isLoading,
    isError: board.isError,
    moveTask: moveTask.mutateAsync,
    isMovingTask: moveTask.isPending,
    reorderTasks: reorderTasks.mutateAsync,
    isReorderingTasks: reorderTasks.isPending,
    refetch: invalidateBoard,
  };
}
