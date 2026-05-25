'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type {
  CompleteSprintPayload,
  CreateSprintPayload,
  MoveTaskPayload,
  ProjectSprintBoardResponse,
  ReorderTaskPayload,
  SprintTask,
  UpdateTaskPayload,
} from '@plan-self/types';
import apiClient, { getAccessToken } from '@/lib/api';
import { useBacklogStore } from '@/store/backlog.store';
import { useDragStore } from '@/store/drag.store';

const getDefaultWsUrl = () =>
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

const boardQueryKey = (projectId: string) => ['sprints', 'board', projectId] as const;
const backlogQueryKey = (
  projectId: string,
  filters: {
    search: string;
    priority: string | null;
    epicId: string | null;
    assigneeId: string | null;
    sortBy: string;
    order: string;
  },
) => ['sprints', 'backlog', projectId, filters] as const;

interface BacklogPageResponse {
  items: SprintTask[];
  nextCursor: string | null;
  totalCount: number;
  projectName: string;
}

export function useSprintBoard(projectId: string) {
  const queryClient = useQueryClient();
  const filters = useBacklogStore((state) => ({
    search: state.search,
    priority: state.priority,
    epicId: state.epicId,
    assigneeId: state.assigneeId,
    sortBy: state.sortBy,
    order: state.order,
  }));
  const setLastUndoMove = useDragStore((state) => state.setLastUndoMove);
  const invalidateTimeout = useRef<NodeJS.Timeout | null>(null);

  const board = useQuery({
    queryKey: boardQueryKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectSprintBoardResponse>(`/projects/${projectId}/sprints`);
      return data;
    },
    staleTime: 15_000,
  });

  const backlog = useInfiniteQuery({
    queryKey: backlogQueryKey(projectId, filters),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: '24',
        search: filters.search,
        sortBy: filters.sortBy,
        order: filters.order,
      });
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.epicId) params.set('epicId', filters.epicId);
      if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);

      const { data } = await apiClient.get<BacklogPageResponse>(
        `/projects/${projectId}/backlog?${params.toString()}`,
      );
      return data;
    },
    getNextPageParam: (lastPage) => (lastPage.nextCursor ? Number(lastPage.nextCursor) : undefined),
    staleTime: 15_000,
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId) });
    void queryClient.invalidateQueries({ queryKey: ['sprints', 'backlog', projectId] });
  };

  const createSprint = useMutation({
    mutationFn: async (payload: CreateSprintPayload) => {
      await apiClient.post('/sprints', payload);
    },
    onSuccess: () => {
      toast.success('Sprint criada com sucesso');
      invalidateAll();
    },
  });

  const completeSprint = useMutation({
    mutationFn: async ({ sprintId, payload }: { sprintId: string; payload?: CompleteSprintPayload }) => {
      await apiClient.post(`/sprints/${sprintId}/complete`, payload ?? {});
    },
    onSuccess: () => {
      toast.success('Sprint concluída');
      invalidateAll();
    },
  });

  const moveTasks = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: MoveTaskPayload }) => {
      const { data } = await apiClient.patch(`/tasks/${taskId}/move`, payload);
      return data;
    },
    onMutate: async ({ payload }) => {
      setLastUndoMove({
        taskIds: payload.taskIds,
        projectId: payload.projectId,
        sourceSprintId: board.data?.activeSprint?.id ?? null,
        targetSprintId: payload.targetSprintId ?? null,
      });
    },
    onSuccess: (_data, variables) => {
      toast.success('Task movida', {
        action: {
          label: 'Desfazer',
          onClick: () => {
            void moveTasks.mutateAsync({
              taskId: variables.payload.taskIds[0],
              payload: {
                projectId: variables.payload.projectId,
                taskIds: variables.payload.taskIds,
                targetSprintId: variables.payload.targetSprintId ? null : board.data?.activeSprint?.id ?? null,
              },
            });
          },
        },
      });
      invalidateAll();
    },
    onError: () => {
      toast.error('Falha ao mover task');
    },
  });

  const reorderTasks = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: ReorderTaskPayload }) => {
      await apiClient.patch(`/tasks/${taskId}/reorder`, payload);
    },
    onSuccess: invalidateAll,
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) => {
      await apiClient.patch(`/tasks/${taskId}`, payload);
    },
    onSuccess: () => {
      toast.success('Task atualizada');
      invalidateAll();
    },
  });

  const createQuickTask = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      await apiClient.post('/dashboard/tasks', { projectId, title });
    },
    onSuccess: () => {
      toast.success('Task adicionada ao backlog');
      invalidateAll();
    },
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_API_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? getDefaultWsUrl();
    const socket: Socket = io(`${wsUrl}/sprints`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
    });

    const invalidate = () => {
      if (invalidateTimeout.current) {
        return;
      }

      invalidateTimeout.current = setTimeout(() => {
        invalidateTimeout.current = null;
        invalidateAll();
      }, 600);
    };

    ['sprint.updated', 'task.moved', 'metrics.updated', 'sprint.completed'].forEach((event) => {
      socket.on(event, invalidate);
    });

    return () => {
      ['sprint.updated', 'task.moved', 'metrics.updated', 'sprint.completed'].forEach((event) => {
        socket.off(event, invalidate);
      });
      if (invalidateTimeout.current) {
        clearTimeout(invalidateTimeout.current);
        invalidateTimeout.current = null;
      }
      socket.disconnect();
    };
  }, [projectId, queryClient]);

  const backlogItems = useMemo(
    () => backlog.data?.pages.flatMap((page) => page.items) ?? [],
    [backlog.data],
  );

  const groupedBacklog = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; color: string | null; tasks: SprintTask[] }>();

    backlogItems.forEach((task) => {
      const key = task.epic?.id ?? 'ungrouped';
      const current = groups.get(key) ?? {
        id: key,
        name: task.epic?.name ?? 'Sem epic',
        color: task.epic?.color ?? null,
        tasks: [],
      };
      current.tasks.push(task);
      groups.set(key, current);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      totalStoryPoints: group.tasks.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
      taskCount: group.tasks.length,
    }));
  }, [backlogItems]);

  return {
    board: board.data,
    backlogItems,
    groupedBacklog,
    isBoardLoading: board.isLoading,
    isBacklogLoading: backlog.isLoading,
    hasNextPage: backlog.hasNextPage,
    fetchNextPage: backlog.fetchNextPage,
    isFetchingNextPage: backlog.isFetchingNextPage,
    createSprint: createSprint.mutateAsync,
    isCreatingSprint: createSprint.isPending,
    completeSprint: completeSprint.mutateAsync,
    isCompletingSprint: completeSprint.isPending,
    moveTasks: moveTasks.mutateAsync,
    isMovingTasks: moveTasks.isPending,
    reorderTasks: reorderTasks.mutateAsync,
    isReorderingTasks: reorderTasks.isPending,
    updateTask: updateTask.mutateAsync,
    isUpdatingTask: updateTask.isPending,
    createQuickTask: createQuickTask.mutateAsync,
    isCreatingTask: createQuickTask.isPending,
    refetch: invalidateAll,
  };
}
