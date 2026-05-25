'use client';

import type { ProjectItem, UpdateProjectPayload } from '@plan-self/types';
import { ProjectFormModal } from './project-form-modal';

export function EditProjectModal({
  open,
  project,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  project: ProjectItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectId: string, payload: UpdateProjectPayload) => Promise<void>;
  isSubmitting?: boolean;
}) {
  return (
    <ProjectFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit project"
      submitLabel="Save changes"
      isSubmitting={isSubmitting}
      initialProject={project}
      onSubmit={async (payload) => {
        if (!project) return;
        await onSubmit(project.id, payload);
      }}
    />
  );
}
