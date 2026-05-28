'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useMemberDirectory, useTeamInvites, useTeams } from '@/hooks/use-teams';
import { useTeamsSocket } from '@/hooks/use-teams-socket';
import { useTeamsStore } from '@/store/teams.store';
import {
  ClientErrorBoundary,
} from '@plan-self/ui';
import {
  CreateTeamModal,
  DeleteTeamConfirmDialog,
  EditTeamModal,
  InviteMemberModal,
  MemberDirectory,
  TeamGrid,
  TeamSettingsModal,
  TeamsErrorState,
  TeamsHeader,
  TeamsSkeleton,
} from '@/components/team';

export default function TeamPage() {
  useSession();
  const { isBootstrapped, isAuthenticated } = useAuth();

  if (!isBootstrapped) return <TeamsSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <ClientErrorBoundary fallback={<TeamsErrorState />}>
      <Suspense fallback={<TeamsSkeleton />}>
        <TeamPageContent />
      </Suspense>
    </ClientErrorBoundary>
  );
}

function TeamPageContent() {
  const {
    teams,
    isLoading,
    isError,
    createTeam,
    updateTeam,
    archiveTeam,
    deleteTeam,
    duplicateTeam,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
  } = useTeams();

  const selectedTeamId = useTeamsStore((state) => state.selectedTeamId);
  const activeModal = useTeamsStore((state) => state.activeModal);
  const searchTerm = useTeamsStore((state) => state.searchTerm);
  const directoryTab = useTeamsStore((state) => state.directoryTab);
  const directoryPage = useTeamsStore((state) => state.directoryPage);
  const setActiveModal = useTeamsStore((state) => state.setActiveModal);
  const setSearchTerm = useTeamsStore((state) => state.setSearchTerm);
  const setSelectedTeamId = useTeamsStore((state) => state.setSelectedTeamId);
  const setDirectoryTab = useTeamsStore((state) => state.setDirectoryTab);
  const setDirectoryPage = useTeamsStore((state) => state.setDirectoryPage);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [teams, selectedTeamId],
  );

  const invites = useTeamInvites(activeModal === 'invite' ? selectedTeamId : null);
  const directory = useMemberDirectory();

  useTeamsSocket(selectedTeamId);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setActiveModal('invite');
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setActiveModal('create');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveModal]);

  if (isError) return <TeamsErrorState />;

  return (
    <>
      <TeamsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenCreate={() => setActiveModal('create')}
        onOpenInvite={() => setActiveModal('invite')}
      />

      <div className="mx-auto max-w-[1600px] space-y-8">
        <TeamGrid
          teams={teams}
          isLoading={isLoading}
          onEdit={(teamId) => {
            setSelectedTeamId(teamId);
            setActiveModal('edit');
          }}
          onArchive={async (teamId) => {
            const team = teams.find((item) => item.id === teamId);
            if (!team) return;
            await archiveTeam({ teamId, archive: !team.archivedAt });
          }}
          onDuplicate={async (teamId) => {
            await duplicateTeam(teamId);
          }}
          onDelete={(teamId) => {
            setSelectedTeamId(teamId);
            setActiveModal('delete');
          }}
        />

        <MemberDirectory
          members={directory.members}
          totalCount={directory.totalCount}
          isLoading={directory.isLoading}
          activeTab={directoryTab}
          onTabChange={setDirectoryTab}
          page={directoryPage}
          onPageChange={setDirectoryPage}
        />
      </div>

      <CreateTeamModal
        open={activeModal === 'create'}
        isSubmitting={isCreatingTeam}
        onOpenChange={(open) => setActiveModal(open ? 'create' : null)}
        onSubmit={createTeam}
      />

      <EditTeamModal
        open={activeModal === 'edit'}
        team={selectedTeam}
        isSubmitting={isUpdatingTeam}
        onOpenChange={(open) => setActiveModal(open ? 'edit' : null)}
        onSubmit={async (teamId, payload) => updateTeam({ teamId, payload })}
      />

      <InviteMemberModal
        open={activeModal === 'invite'}
        teams={teams}
        selectedTeamId={selectedTeamId}
        isSubmitting={invites.isSendingInvite}
        onOpenChange={(open) => setActiveModal(open ? 'invite' : null)}
        onSubmit={async (teamId, payload) => {
          setSelectedTeamId(teamId);
          await invites.sendInvite({ teamId, payload });
        }}
      />

      <TeamSettingsModal
        open={activeModal === 'settings'}
        team={selectedTeam}
        onOpenChange={(open) => setActiveModal(open ? 'settings' : null)}
        onArchive={async (teamId) => {
          const team = teams.find((item) => item.id === teamId);
          if (!team) return;
          await archiveTeam({ teamId, archive: !team.archivedAt });
        }}
        onDelete={async (teamId) => {
          await deleteTeam(teamId);
          setActiveModal(null);
          setSelectedTeamId(null);
        }}
      />

      <DeleteTeamConfirmDialog
        open={activeModal === 'delete'}
        team={selectedTeam}
        isDeleting={isDeletingTeam}
        onOpenChange={(open) => setActiveModal(open ? 'delete' : null)}
        onConfirm={async (teamId) => {
          await deleteTeam(teamId);
          setSelectedTeamId(null);
        }}
      />
    </>
  );
}
