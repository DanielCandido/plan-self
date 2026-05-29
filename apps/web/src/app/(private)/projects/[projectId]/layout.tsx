import type { ReactNode } from 'react';
import { ProjectWorkspaceHeader } from '@/components/projects/project-workspace-header';

export default function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { projectId: string };
}) {
  return (
    <>
      <div className="mx-auto max-w-[1600px]">
        <ProjectWorkspaceHeader projectId={params.projectId} />
      </div>
      {children}
    </>
  );
}
