'use client';

import { Suspense, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useProjectMembers, useProjects } from '@/hooks/use-projects';
import { useProjectsStore } from '@/store/projects.store';
import {
  CreateProjectModal,
  EditProjectModal,
  ProjectFilters,
  ProjectGrid,
  ProjectsHeader,
  ProjectMembersModal,
} from '@/components/projects';
import {
  ClientErrorBoundary,
  ProjectsErrorState,
  ProjectsSkeleton,
} from '@plan-self/ui';

export default function ProjectsPage() {
  useSession();
  const { isBootstrapped, isAuthenticated } = useAuth();

  if (!isBootstrapped) return <ProjectsSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <ClientErrorBoundary fallback={<ProjectsErrorState />}>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsPageContent />
      </Suspense>
    </ClientErrorBoundary>
  );
}

function ProjectsPageContent() {
  const { projects, totalCount, isLoading, isError, createProject, updateProject, archiveProject, isCreatingProject, isUpdatingProject } =
    useProjects();
  const [memberSearch, setMemberSearch] = useState('');

  const filterStatus = useProjectsStore((state) => state.filterStatus);
  const filterPriority = useProjectsStore((state) => state.filterPriority);
  const filterOwnerId = useProjectsStore((state) => state.filterOwnerId);
  const activeModal = useProjectsStore((state) => state.activeModal);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
  const searchTerm = useProjectsStore((state) => state.searchTerm);
  const setFilterStatus = useProjectsStore((state) => state.setFilterStatus);
  const setFilterPriority = useProjectsStore((state) => state.setFilterPriority);
  const setFilterOwnerId = useProjectsStore((state) => state.setFilterOwnerId);
  const setActiveModal = useProjectsStore((state) => state.setActiveModal);
  const setSelectedProjectId = useProjectsStore((state) => state.setSelectedProjectId);
  const setSearchTerm = useProjectsStore((state) => state.setSearchTerm);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const ownerOptions = useMemo(() => {
    const owners = new Map<string, string>();
    projects.forEach((project) => {
      if (project.ownerId && project.owner?.name) owners.set(project.ownerId, project.owner.name);
    });
    return Array.from(owners.entries()).map(([value, label]) => ({ value, label }));
  }, [projects]);

  const members = useProjectMembers(
    activeModal === 'members' ? selectedProjectId : null,
    memberSearch,
  );

  if (isError) return <ProjectsErrorState />;

  return (
    <>
      <ProjectsHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} onClear={() => setSearchTerm('')} />
      <div className="mx-auto max-w-[1600px]">
        <ProjectFilters
          totalCount={totalCount}
          status={filterStatus}
          priority={filterPriority}
          ownerId={filterOwnerId}
          ownerOptions={ownerOptions}
          onStatusChange={setFilterStatus}
          onPriorityChange={setFilterPriority}
          onOwnerChange={setFilterOwnerId}
        />

        <ProjectGrid
          projects={projects}
          isLoading={isLoading}
          onCreate={() => setActiveModal('create')}
          onEdit={(projectId) => {
            setSelectedProjectId(projectId);
            setActiveModal('edit');
          }}
          onMembers={(projectId) => {
            setSelectedProjectId(projectId);
            setActiveModal('members');
          }}
          onArchive={async (projectId) => {
            const project = projects.find((item) => item.id === projectId);
            if (!project) return;
            setSelectedProjectId(projectId);
            await archiveProject({
              projectId,
              payload: { archive: !project.archived },
            });
          }}
        />
      </div>

      <CreateProjectModal
        open={activeModal === 'create'}
        onOpenChange={(open) => setActiveModal(open ? 'create' : null)}
        onSubmit={async (payload) => {
          await createProject(payload);
        }}
        isSubmitting={isCreatingProject}
      />

      <EditProjectModal
        open={activeModal === 'edit'}
        project={selectedProject}
        onOpenChange={(open) => setActiveModal(open ? 'edit' : null)}
        onSubmit={async (projectId, payload) => {
          await updateProject({ projectId, payload });
        }}
        isSubmitting={isUpdatingProject}
      />

      <ProjectMembersModal
        open={activeModal === 'members'}
        projectName={selectedProject?.name ?? 'Project'}
        members={members.members}
        availableUsers={members.availableUsers}
        isLoading={members.isLoadingMembers || members.isLoadingUsers}
        isSaving={members.isAddingMember || members.isRemovingMember}
        onOpenChange={(open) => {
          setActiveModal(open ? 'members' : null);
          if (!open) setSelectedProjectId(null);
        }}
        onSearchChange={setMemberSearch}
        onAddMember={async (userId) => {
          await members.addMember({ userId });
        }}
        onRemoveMember={async (userId) => {
          await members.removeMember(userId);
        }}
      />
    </>
  );
}
