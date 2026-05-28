'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateTeamPayload,
  InvitePayload,
  TeamInviteItem,
  TeamMemberItem,
  UpdateMemberRolePayload,
  UpdateTeamPayload,
} from '@plan-self/types';
import { teamService } from '@/services/team.service';
import { useTeamsStore } from '@/store/teams.store';

const teamsQueryKey = (query: Record<string, unknown>) => ['teams', query] as const;
const teamDetailQueryKey = (teamId: string) => ['teams', teamId] as const;
const teamMembersQueryKey = (teamId: string) => ['teams', teamId, 'members'] as const;
const teamInvitesQueryKey = (teamId: string) => ['teams', teamId, 'invites'] as const;
const teamDirectoryQueryKey = (query: Record<string, unknown>) => ['teams', 'directory', query] as const;

export function useTeams() {
  const queryClient = useQueryClient();
  const searchTerm = useTeamsStore((state) => state.searchTerm);

  const query = useMemo(
    () => ({
      page: 0,
      perPage: 24,
      q: searchTerm,
      archived: false,
      sortBy: 'updatedAt',
      order: 'desc',
    }),
    [searchTerm],
  );

  const teams = useQuery({
    queryKey: teamsQueryKey(query),
    queryFn: async () => {
      return teamService.list(query);
    },
    staleTime: 15_000,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['teams'] });
  };

  const createTeam = useMutation({
    mutationFn: async (payload: CreateTeamPayload) => {
      return teamService.create(payload);
    },
    onSuccess: async () => {
      toast.success('Time criado com sucesso');
      await invalidate();
    },
    onError: () => toast.error('Falha ao criar time'),
  });

  const updateTeam = useMutation({
    mutationFn: async ({ teamId, payload }: { teamId: string; payload: UpdateTeamPayload }) => {
      return teamService.update(teamId, payload);
    },
    onSuccess: async () => {
      toast.success('Time atualizado');
      await invalidate();
    },
    onError: () => toast.error('Falha ao atualizar time'),
  });

  const archiveTeam = useMutation({
    mutationFn: async ({ teamId, archive }: { teamId: string; archive: boolean }) => {
      await teamService.archive(teamId, archive);
    },
    onSuccess: async (_data, variables) => {
      toast.success(variables.archive ? 'Time arquivado' : 'Time restaurado');
      await invalidate();
    },
    onError: () => toast.error('Falha ao arquivar time'),
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      await teamService.remove(teamId);
    },
    onSuccess: async () => {
      toast.success('Time excluído');
      await invalidate();
    },
    onError: () => toast.error('Falha ao excluir time'),
  });

  const duplicateTeam = useMutation({
    mutationFn: async (teamId: string) => {
      return teamService.duplicate(teamId);
    },
    onSuccess: async () => {
      toast.success('Time duplicado');
      await invalidate();
    },
    onError: () => toast.error('Falha ao duplicar time'),
  });

  return {
    teams: teams.data?.items ?? [],
    totalCount: teams.data?.totalCount ?? 0,
    isLoading: teams.isLoading,
    isError: teams.isError,
    createTeam: createTeam.mutateAsync,
    updateTeam: updateTeam.mutateAsync,
    archiveTeam: archiveTeam.mutateAsync,
    deleteTeam: deleteTeam.mutateAsync,
    duplicateTeam: duplicateTeam.mutateAsync,
    isCreatingTeam: createTeam.isPending,
    isUpdatingTeam: updateTeam.isPending,
    isArchivingTeam: archiveTeam.isPending,
    isDeletingTeam: deleteTeam.isPending,
    isDuplicatingTeam: duplicateTeam.isPending,
    refetch: invalidate,
  };
}

export function useTeamDetail(teamId: string | null) {
  return useQuery({
    queryKey: teamId ? teamDetailQueryKey(teamId) : ['teams', 'detail', 'disabled'],
    queryFn: async () => {
      if (!teamId) return null;
      return teamService.getById(teamId);
    },
    enabled: Boolean(teamId),
  });
}

export function useTeamMembers(teamId: string | null) {
  const queryClient = useQueryClient();

  const members = useQuery({
    queryKey: teamId ? teamMembersQueryKey(teamId) : ['teams', 'members', 'disabled'],
    queryFn: async () => {
      if (!teamId) return [] as TeamMemberItem[];
      return teamService.listMembers(teamId);
    },
    enabled: Boolean(teamId),
    staleTime: 15_000,
  });

  const invalidate = async () => {
    if (!teamId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: teamMembersQueryKey(teamId) }),
      queryClient.invalidateQueries({ queryKey: ['teams'] }),
    ]);
  };

  const addMember = useMutation({
    mutationFn: async (payload: { userId: string; role?: string }) => {
      if (!teamId) return [];
      return teamService.addMember(teamId, payload);
    },
    onSuccess: async () => {
      toast.success('Membro adicionado');
      await invalidate();
    },
    onError: () => toast.error('Falha ao adicionar membro'),
  });

  const updateMember = useMutation({
    mutationFn: async ({ memberId, payload }: { memberId: string; payload: UpdateMemberRolePayload }) => {
      if (!teamId) return [];
      return teamService.updateMember(teamId, memberId, payload);
    },
    onSuccess: async () => {
      toast.success('Membro atualizado');
      await invalidate();
    },
    onError: () => toast.error('Falha ao atualizar membro'),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!teamId) return [];
      return teamService.removeMember(teamId, memberId);
    },
    onSuccess: async () => {
      toast.success('Membro removido');
      await invalidate();
    },
    onError: () => toast.error('Falha ao remover membro'),
  });

  return {
    members: members.data ?? [],
    isLoadingMembers: members.isLoading,
    addMember: addMember.mutateAsync,
    updateMember: updateMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
    isAddingMember: addMember.isPending,
    isUpdatingMember: updateMember.isPending,
    isRemovingMember: removeMember.isPending,
  };
}

export function useTeamInvites(teamId: string | null) {
  const queryClient = useQueryClient();

  const invites = useQuery({
    queryKey: teamId ? teamInvitesQueryKey(teamId) : ['teams', 'invites', 'disabled'],
    queryFn: async () => {
      if (!teamId) return [] as TeamInviteItem[];
      return teamService.listInvites(teamId);
    },
    enabled: Boolean(teamId),
    staleTime: 15_000,
  });

  const invalidate = async () => {
    if (!teamId) return;
    await queryClient.invalidateQueries({ queryKey: teamInvitesQueryKey(teamId) });
  };

  const sendInvite = useMutation({
    mutationFn: async ({ teamId: targetTeamId, payload }: { teamId: string; payload: InvitePayload }) => {
      return teamService.sendInvites(targetTeamId, payload);
    },
    onSuccess: async (_data, variables) => {
      toast.success('Convite(s) enviado(s)');
      await queryClient.invalidateQueries({ queryKey: teamInvitesQueryKey(variables.teamId) });
      await invalidate();
    },
    onError: () => toast.error('Falha ao enviar convite'),
  });

  const revokeInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      await teamService.revokeInvite(inviteId);
    },
    onSuccess: async () => {
      toast.success('Convite revogado');
      await invalidate();
    },
    onError: () => toast.error('Falha ao revogar convite'),
  });

  const resendInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      await teamService.resendInvite(inviteId);
    },
    onSuccess: async () => {
      toast.success('Convite reenviado');
      await invalidate();
    },
    onError: () => toast.error('Falha ao reenviar convite'),
  });

  return {
    invites: invites.data ?? [],
    isLoadingInvites: invites.isLoading,
    sendInvite: sendInvite.mutateAsync,
    revokeInvite: revokeInvite.mutateAsync,
    resendInvite: resendInvite.mutateAsync,
    isSendingInvite: sendInvite.isPending,
    isRevokingInvite: revokeInvite.isPending,
    isResendingInvite: resendInvite.isPending,
  };
}

export function useMemberDirectory() {
  const directoryPage = useTeamsStore((state) => state.directoryPage);
  const filterRole = useTeamsStore((state) => state.filterRole);
  const searchTerm = useTeamsStore((state) => state.searchTerm);

  const query = useMemo(
    () => ({
      page: directoryPage,
      perPage: 8,
      q: searchTerm,
      role: filterRole ?? undefined,
    }),
    [directoryPage, filterRole, searchTerm],
  );

  const directory = useQuery({
    queryKey: teamDirectoryQueryKey(query),
    queryFn: async () => {
      return teamService.directory(query);
    },
    staleTime: 15_000,
  });

  return {
    members: directory.data?.items ?? [],
    totalCount: directory.data?.totalCount ?? 0,
    isLoading: directory.isLoading,
    isError: directory.isError,
  };
}
