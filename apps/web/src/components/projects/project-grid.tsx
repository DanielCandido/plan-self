'use client';

import type { ProjectItem } from '@plan-self/types';
import { ProjectsSkeleton } from '@plan-self/ui';
import { CreateProjectCard } from './create-project-card';
import { ProjectCard } from './project-card';

export function ProjectGrid({
  projects,
  isLoading,
  onCreate,
  onEdit,
  onMembers,
  onArchive,
}: {
  projects: ProjectItem[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (projectId: string) => void;
  onMembers: (projectId: string) => void;
  onArchive: (projectId: string) => void;
}) {
  if (isLoading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onMembers={onMembers}
          onArchive={onArchive}
        />
      ))}
      <CreateProjectCard onClick={onCreate} />
    </div>
  );
}
