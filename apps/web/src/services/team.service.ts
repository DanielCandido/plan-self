import type {
  CreateTeamPayload,
  InvitePayload,
  TeamDirectoryResponse,
  TeamInviteItem,
  TeamItem,
  TeamListResponse,
  TeamMemberItem,
  UpdateMemberRolePayload,
  UpdateTeamPayload,
} from '@plan-self/types';
import apiClient from '@/lib/api';

export const teamService = {
  async list(params: Record<string, unknown>) {
    const { data } = await apiClient.get<TeamListResponse>('/teams', { params });
    return data;
  },
  async getById(teamId: string) {
    const { data } = await apiClient.get<TeamItem>(`/teams/${teamId}`);
    return data;
  },
  async create(payload: CreateTeamPayload) {
    const { data } = await apiClient.post<TeamItem>('/teams', payload);
    return data;
  },
  async update(teamId: string, payload: UpdateTeamPayload) {
    const { data } = await apiClient.patch<TeamItem>(`/teams/${teamId}`, payload);
    return data;
  },
  async archive(teamId: string, archive: boolean) {
    await apiClient.post(`/teams/${teamId}/archive`, { archive });
  },
  async remove(teamId: string) {
    await apiClient.delete(`/teams/${teamId}`);
  },
  async duplicate(teamId: string) {
    const { data } = await apiClient.post<TeamItem>(`/teams/${teamId}/duplicate`);
    return data;
  },
  async listMembers(teamId: string) {
    const { data } = await apiClient.get<TeamMemberItem[]>(`/teams/${teamId}/members`);
    return data;
  },
  async addMember(teamId: string, payload: { userId: string; role?: string }) {
    const { data } = await apiClient.post<TeamMemberItem[]>(`/teams/${teamId}/members`, payload);
    return data;
  },
  async updateMember(teamId: string, memberId: string, payload: UpdateMemberRolePayload) {
    const { data } = await apiClient.patch<TeamMemberItem[]>(`/teams/${teamId}/members/${memberId}`, payload);
    return data;
  },
  async removeMember(teamId: string, memberId: string) {
    const { data } = await apiClient.delete<TeamMemberItem[]>(`/teams/${teamId}/members/${memberId}`);
    return data;
  },
  async listInvites(teamId: string) {
    const { data } = await apiClient.get<TeamInviteItem[]>(`/teams/${teamId}/invites`);
    return data;
  },
  async sendInvites(teamId: string, payload: InvitePayload) {
    const { data } = await apiClient.post<TeamInviteItem[]>(`/teams/${teamId}/invites`, payload);
    return data;
  },
  async revokeInvite(inviteId: string) {
    await apiClient.delete(`/invites/${inviteId}`);
  },
  async resendInvite(inviteId: string) {
    await apiClient.post(`/invites/${inviteId}/resend`);
  },
  async directory(params: Record<string, unknown>) {
    const { data } = await apiClient.get<TeamDirectoryResponse>('/teams/directory', { params });
    return data;
  },
};
