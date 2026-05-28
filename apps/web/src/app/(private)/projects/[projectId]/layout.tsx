'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { ProjectWorkspaceHeader } from '@/components/projects/project-workspace-header';

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ projectId: string }>();

  return (
    <>
      <div className="mx-auto max-w-[1600px]">
        <ProjectWorkspaceHeader projectId={params.projectId} />
      </div>
      {children}
    </>
  );
}
