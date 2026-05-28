'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ArchiveProjectPayload,
  CreateProjectPayload,
  ListProjectsQuery,
  ProjectCountsResponse,
  ProjectItem,
  ProjectOwnerOption,
  ProjectTeamOption,
  ProjectListResponse,
  ProjectMember,
  ProjectAvailableUser,
  UpdateProjectPayload,
} from '@plan-self/types';
import apiClient from '@/lib/api';
import { useProjectsStore } from '@/store/projects.store';

const projectsQueryKey = (query: ListProjectsQuery) => ['projects', query] as const;
const projectCountsQueryKey = ['projects', 'counts'] as const;
const projectDetailQueryKey = (projectId: string) => ['projects', projectId, 'detail'] as const;
const projectMembersQueryKey = (projectId: string) => ['projects', projectId, 'members'] as const;
const projectUsersQueryKey = (projectId: string, search: string) => ['projects', projectId, 'users', search] as const;
const projectOwnerOptionsQueryKey = (search: string) => ['projects', 'options', 'owners', search] as const;
const projectTeamOptionsQueryKey = (search: string) => ['projects', 'options', 'teams', search] as const;

export function useProjects() {
  const queryClient = useQueryClient();
  const filterStatus = useProjectsStore((state) => state.filterStatus);
  const filterPriority = useProjectsStore((state) => state.filterPriority);
  const filterOwnerId = useProjectsStore((state) => state.filterOwnerId);
  const searchTerm = useProjectsStore((state) => state.searchTerm);

  const query = useMemo<ListProjectsQuery>(
    () => ({
      page: 0,
      perPage: 50,
      q: searchTerm,
      status: filterStatus ?? undefined,
      priority: filterPriority ?? undefined,
      ownerId: filterOwnerId ?? undefined,
      sortBy: 'updatedAt',
      order: 'desc',
    }),
    [filterOwnerId, filterPriority, filterStatus, searchTerm],
  );

  const projects = useQuery({
    queryKey: projectsQueryKey(query),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectListResponse>('/projects', { params: query });
      return data;
    },
    staleTime: 20_000,
  });

  const counts = useQuery({
    queryKey: projectCountsQueryKey,
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectCountsResponse>('/projects/counts');
      return data;
    },
    staleTime: 30_000,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: projectCountsQueryKey }),
    ]);
  };

  const createProject = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await apiClient.post<ProjectItem>('/projects', payload);
      return data;
    },
    onSuccess: async () => {
      toast.success('Projeto criado com sucesso');
      await invalidate();
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: UpdateProjectPayload;
    }) => {
      const { data } = await apiClient.patch<ProjectItem>(`/projects/${projectId}`, payload);
      return data;
    },
    onSuccess: async () => {
      toast.success('Projeto atualizado');
      await invalidate();
    },
  });

  const archiveProject = useMutation({
    mutationFn: async ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: ArchiveProjectPayload;
    }) => {
      await apiClient.post(`/projects/${projectId}/archive`, payload);
    },
    onSuccess: async (_data, variables) => {
      toast.success(variables.payload.archive ? 'Projeto arquivado' : 'Projeto restaurado');
      await invalidate();
    },
  });

  return {
    projects: projects.data?.items ?? [],
    totalCount: projects.data?.totalCount ?? 0,
    counts: counts.data ?? { total: 0, withBacklog: 0, completed: 0 },
    isLoading: projects.isLoading || counts.isLoading,
    isFetching: projects.isFetching,
    isError: projects.isError || counts.isError,
    createProject: createProject.mutateAsync,
    isCreatingProject: createProject.isPending,
    updateProject: updateProject.mutateAsync,
    isUpdatingProject: updateProject.isPending,
    archiveProject: archiveProject.mutateAsync,
    isArchivingProject: archiveProject.isPending,
    refetch: invalidate,
  };
}

export function useProjectMembers(projectId: string | null, search = '') {
  const queryClient = useQueryClient();

  const members = useQuery({
    queryKey: projectId ? projectMembersQueryKey(projectId) : ['projects', 'members', 'disabled'],
    queryFn: async () => {
      if (!projectId) return [] as ProjectMember[];
      const { data } = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
      return data;
    },
    enabled: Boolean(projectId),
    staleTime: 20_000,
  });

  const users = useQuery({
    queryKey: projectId ? projectUsersQueryKey(projectId, search) : ['projects', 'users', 'disabled'],
    queryFn: async () => {
      if (!projectId) return [] as ProjectAvailableUser[];
      const { data } = await apiClient.get<ProjectAvailableUser[]>(`/projects/${projectId}/users`, {
        params: { q: search },
      });
      return data;
    },
    enabled: Boolean(projectId),
    staleTime: 20_000,
  });

  const refreshMembers = async () => {
    if (!projectId) return;
    await queryClient.invalidateQueries({ queryKey: projectMembersQueryKey(projectId) });
  };

  const addMember = useMutation({
    mutationFn: async (payload: { userId: string; role?: string }) => {
      if (!projectId) return [] as ProjectMember[];
      const { data } = await apiClient.post<ProjectMember[]>(`/projects/${projectId}/members`, payload);
      return data;
    },
    onSuccess: async () => {
      toast.success('Membro adicionado ao projeto');
      await refreshMembers();
    },
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!projectId) return [] as ProjectMember[];
      const { data } = await apiClient.delete<ProjectMember[]>(`/projects/${projectId}/members/${userId}`);
      return data;
    },
    onSuccess: async () => {
      toast.success('Membro removido do projeto');
      await refreshMembers();
    },
  });

  return {
    members: members.data ?? [],
    isLoadingMembers: members.isLoading,
    availableUsers: users.data ?? [],
    isLoadingUsers: users.isLoading,
    addMember: addMember.mutateAsync,
    isAddingMember: addMember.isPending,
    removeMember: removeMember.mutateAsync,
    isRemovingMember: removeMember.isPending,
  };
}

export function useProjectFormOptions(ownerSearch = '', teamSearch = '', enabled = true) {
  const owners = useQuery({
    queryKey: projectOwnerOptionsQueryKey(ownerSearch),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectOwnerOption[]>('/projects/options/owners', {
        params: { q: ownerSearch, limit: 50 },
      });
      return data;
    },
    staleTime: 20_000,
    enabled,
  });

  const teams = useQuery({
    queryKey: projectTeamOptionsQueryKey(teamSearch),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectTeamOption[]>('/projects/options/teams', {
        params: { q: teamSearch, limit: 50 },
      });
      return data;
    },
    staleTime: 20_000,
    enabled,
  });

  return {
    ownerOptions: owners.data ?? [],
    teamOptions: teams.data ?? [],
    isLoadingOwnerOptions: owners.isLoading,
    isLoadingTeamOptions: teams.isLoading,
  };
}

export function useProjectById(projectId: string) {
  return useQuery({
    queryKey: projectDetailQueryKey(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectItem>(`/projects/${projectId}`);
      return data;
    },
    staleTime: 30_000,
    enabled: Boolean(projectId),
  });
}
