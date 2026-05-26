'use client';

import type { CreateProjectPayload } from '@plan-self/types';
import { ProjectFormModal } from './project-form-modal';

export function CreateProjectModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
  isSubmitting?: boolean;
}) {
  return (
    <ProjectFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create project"
      submitLabel="Create project"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
