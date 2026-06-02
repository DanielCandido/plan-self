'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { KanbanBoardResponse, TaskDetail } from '@plan-self/types';
import apiClient from '@/lib/api';

const taskDetailQueryKey = (taskId: string) => ['tasks', taskId, 'detail'] as const;
const taskActivityQueryKey = (taskId: string) => ['tasks', taskId, 'activity'] as const;
const taskBoardColumnsQueryKey = (projectId: string) => ['tasks', 'board-columns', projectId] as const;

export type TaskActivityItem = {
  type: 'comment' | 'history';
  id: string;
  createdAt: string;
  // comment fields
  taskId?: string;
  content?: string;
  author?: { id: string; name: string; avatarUrl: string | null };
  // history fields
  action?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  fromColumnId?: string | null;
  toColumnId?: string | null;
  actor?: { id: string; name: string; avatarUrl: string | null } | null;
};

export function useTaskDetail(taskId: string | null, projectId: string) {
  const queryClient = useQueryClient();

  const invalidateBoards = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['sprints', 'board', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['sprints', 'backlog', projectId] }),
    ]);
  };

  const taskQuery = useQuery({
    queryKey: taskDetailQueryKey(taskId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<TaskDetail>(`/tasks/${taskId}`);
      return data;
    },
    enabled: Boolean(taskId),
    staleTime: 10_000,
  });

  const activityQuery = useQuery({
    queryKey: taskActivityQueryKey(taskId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<TaskActivityItem[]>(`/tasks/${taskId}/activity`);
      return data;
    },
    enabled: Boolean(taskId),
    staleTime: 5_000,
  });

  const boardColumnsQuery = useQuery({
    queryKey: taskBoardColumnsQueryKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<KanbanBoardResponse>(`/boards/${projectId}`);
      return data.columns;
    },
    staleTime: 10_000,
  });

  const updateTask = useMutation({
    mutationFn: async (payload: Partial<TaskDetail> & { checklist?: TaskDetail['checklist']; assigneeIds?: string[] }) => {
      const { data } = await apiClient.patch<TaskDetail>(`/tasks/${taskId}`, payload);
      return data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(taskDetailQueryKey(taskId ?? ''), data);
      await invalidateBoards();
    },
    onError: () => {
      toast.error('Erro ao atualizar tarefa');
    },
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post(`/tasks/${taskId}/comments`, { content });
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskDetailQueryKey(taskId ?? '') }),
        queryClient.invalidateQueries({ queryKey: taskActivityQueryKey(taskId ?? '') }),
      ]);
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskDetailQueryKey(taskId ?? '') }),
        queryClient.invalidateQueries({ queryKey: taskActivityQueryKey(taskId ?? '') }),
      ]);
    },
    onError: () => {
      toast.error('Erro ao deletar comentário');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/tasks/${taskId}`);
    },
    onSuccess: async () => {
      toast.success('Tarefa removida');
      queryClient.removeQueries({ queryKey: taskDetailQueryKey(taskId ?? '') });
      await invalidateBoards();
    },
    onError: () => {
      toast.error('Erro ao remover tarefa');
    },
  });

  return {
    task: taskQuery.data ?? null,
    isLoading: taskQuery.isLoading,
    activity: activityQuery.data ?? [],
    isActivityLoading: activityQuery.isLoading,
    boardColumns: boardColumnsQuery.data ?? [],
    updateTask,
    createComment,
    deleteComment,
    deleteTask,
  };
}
