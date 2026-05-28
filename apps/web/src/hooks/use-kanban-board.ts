'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { BoardTask, KanbanBoardResponse, MoveBoardTaskPayload, ReorderBoardTaskPayload } from '@plan-self/types';
import apiClient, { getAccessToken } from '@/lib/api';
import { resolveRealtimeUrl } from '@/lib/realtime';

const boardQueryKey = (projectId: string) => ['kanban', 'board', projectId] as const;

export function useKanbanBoard(projectId: string) {
  const queryClient = useQueryClient();
  const invalidateTimeout = useRef<NodeJS.Timeout | null>(null);

  const board = useQuery({
    queryKey: boardQueryKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<KanbanBoardResponse>(`/boards/${projectId}`);
      return data;
    },
    staleTime: 15_000,
  });

  const invalidateBoard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
  }, [projectId, queryClient]);

  const moveTask = useMutation({
    mutationFn: async (payload: MoveBoardTaskPayload) => {
      await apiClient.patch('/boards/tasks/move', payload);
    },
    onSuccess: () => {
      invalidateBoard();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Falha ao mover task';
      toast.error(message);
    },
  });

  const reorderTasks = useMutation({
    mutationFn: async (payload: ReorderBoardTaskPayload) => {
      await apiClient.patch('/boards/tasks/reorder', payload);
    },
    onSuccess: () => {
      invalidateBoard();
    },
    onError: () => {
      toast.error('Falha ao reordenar tasks');
    },
  });

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

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const wsUrl = resolveRealtimeUrl();
    const socket: Socket = io(`${wsUrl}/sprints`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
    });

    const invalidate = () => {
      if (invalidateTimeout.current) return;

      invalidateTimeout.current = setTimeout(() => {
        invalidateTimeout.current = null;
        invalidateBoard();
      }, 600);
    };

    ['task.moved', 'task.updated', 'metrics.updated'].forEach((event) => {
      socket.on(event, invalidate);
    });

    return () => {
      ['task.moved', 'task.updated', 'metrics.updated'].forEach((event) => {
        socket.off(event, invalidate);
      });
      if (invalidateTimeout.current) {
        clearTimeout(invalidateTimeout.current);
        invalidateTimeout.current = null;
      }
      socket.disconnect();
    };
  }, [invalidateBoard]);

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
