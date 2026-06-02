'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type { DashboardOverviewResponse, DashboardTask, DashboardTaskState } from '@plan-self/types';
import type { BoardColumn } from '@plan-self/types';
import apiClient, { getAccessToken } from '@/lib/api';
import { resolveRealtimeUrl } from '@/lib/realtime';
import { useDashboardStore } from '@/store/dashboard.store';

const DASHBOARD_QUERY_KEY = ['dashboard', 'overview'] as const;
const REALTIME_EVENTS = ['task.updated', 'task.created', 'sprint.updated'] as const;
const DASHBOARD_STALE_TIME_MS = 20_000;
const DASHBOARD_GC_TIME_MS = 120_000;
const REALTIME_THROTTLE_MS = 750;

export function useDashboard() {
  const queryClient = useQueryClient();
  const searchTerm = useDashboardStore((state) => state.searchTerm);
  const invalidateTimeout = useRef<NodeJS.Timeout | null>(null);

  const overviewQuery = useSuspenseQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardOverviewResponse>('/dashboard/overview');
      return data;
    },
    staleTime: DASHBOARD_STALE_TIME_MS,
    gcTime: DASHBOARD_GC_TIME_MS,
  });

  const getBoardColumnIdByType = async (projectId: string, type: DashboardTaskState) => {
    const columns = await queryClient.fetchQuery({
      queryKey: ['dashboard', 'columns', projectId],
      queryFn: async () => {
        const { data } = await apiClient.get<{ columns: BoardColumn[] }>(`/boards/${projectId}`);
        return data.columns;
      },
      staleTime: DASHBOARD_STALE_TIME_MS,
    });

    return columns.find((column) => column.type === type)?.id ?? null;
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: async (payload: {
      taskId: string;
      projectId: string;
      boardColumnType: DashboardTaskState;
    }) => {
      const boardColumnId = await getBoardColumnIdByType(payload.projectId, payload.boardColumnType);
      if (!boardColumnId) {
        throw new Error('Coluna de destino não encontrada');
      }
      const { data } = await apiClient.patch<DashboardTask>(
        `/dashboard/tasks/${payload.taskId}/status`,
        { boardColumnId },
      );
      return data;
    },
    onMutate: async ({ taskId, boardColumnType }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });

      const previous = queryClient.getQueryData<DashboardOverviewResponse>(DASHBOARD_QUERY_KEY);

      if (previous) {
        queryClient.setQueryData<DashboardOverviewResponse>(DASHBOARD_QUERY_KEY, {
          ...previous,
          myTasks: previous.myTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  boardColumnType,
                }
              : task,
          ),
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const dashboardWsUrl = resolveRealtimeUrl();

    const socket: Socket = io(`${dashboardWsUrl}/dashboard`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
    });

    const throttledInvalidate = () => {
      if (invalidateTimeout.current) {
        return;
      }

      invalidateTimeout.current = setTimeout(() => {
        invalidateTimeout.current = null;
        void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      }, REALTIME_THROTTLE_MS);
    };

    REALTIME_EVENTS.forEach((event) => {
      socket.on(event, throttledInvalidate);
    });

    return () => {
      REALTIME_EVENTS.forEach((event) => {
        socket.off(event, throttledInvalidate);
      });

      if (invalidateTimeout.current) {
        clearTimeout(invalidateTimeout.current);
        invalidateTimeout.current = null;
      }

      socket.disconnect();
    };
  }, [queryClient]);

  const filteredData = useMemo(() => {
    const source = overviewQuery.data;

    if (!searchTerm.trim()) {
      return source;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();

    return {
      ...source,
      myTasks: source.myTasks.filter((task) =>
        [task.title, task.project, task.priority, ...task.assignees.map((assignee) => assignee.name)]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch),
      ),
      recentActivities: source.recentActivities.filter((activity) =>
        [activity.type, activity.user, activity.task ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    };
  }, [overviewQuery.data, searchTerm]);

  return {
    data: filteredData,
    rawData: overviewQuery.data,
    searchTerm,
    isUpdatingTask: updateTaskStatusMutation.isPending,
    updateTaskStatus: updateTaskStatusMutation.mutateAsync,
  };
}
