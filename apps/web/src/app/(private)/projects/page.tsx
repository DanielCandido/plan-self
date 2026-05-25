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
  ProjectMembersModal,
} from '@/components/projects';
import {
  ClientErrorBoundary,
  ProjectsErrorState,
  ProjectsSkeleton,
  WorkspaceLayout,
} from '@plan-self/ui';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Tasks', href: '/my-tasks' },
  { label: 'Projects', href: '/projects', active: true },
  { label: 'Team', href: '/team' },
  { label: 'Reports', href: '/reports' },
];

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
    <WorkspaceLayout
      navItems={NAV_ITEMS}
      onNewProject={() => setActiveModal('create')}
      sidebarFooter={
        <div className="space-y-4 border-t border-white/10 pt-6 text-sm text-white/55">
          <a href="#" className="block hover:text-white">
            Help
          </a>
          <a href="#" className="block hover:text-white">
            Logout
          </a>
        </div>
      }
      mainClassName="bg-[#0b0d16]"
      header={
        <div className="mx-auto mb-8 flex max-w-[1600px] items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-semibold tracking-tight text-white">Projects</h1>
            <p className="mt-3 text-3xl text-white/65">
              Overview of all active organizational initiatives and their current trajectory.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!selectedProject}
              className="rounded-md border border-white/15 bg-white/[0.03] px-5 py-3 text-base text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={async () => {
                if (!selectedProject) return;
                await archiveProject({
                  projectId: selectedProject.id,
                  payload: { archive: !selectedProject.archived },
                });
              }}
            >
              Archive
            </button>
            <button
              type="button"
              className="rounded-md border border-white/15 bg-white/[0.03] px-4 py-3 text-base text-white/80"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
          </div>
        </div>
      }
      contentClassName="py-8 xl:px-8"
      sidebarClassName="w-80"
      desktopSidebarVisibilityClassName="xl:flex xl:flex-col"
      contentOffsetClassName="xl:ml-80"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search projects, files..."
            className="w-full max-w-[540px] rounded-md border border-white/10 bg-white/[0.03] px-5 py-3 text-xl text-white/85 outline-none"
          />
        </div>

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
    </WorkspaceLayout>
  );
}
