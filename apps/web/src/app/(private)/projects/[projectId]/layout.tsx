import { use, type ReactNode } from 'react';
import { ProjectWorkspaceHeader } from '@/components/projects/project-workspace-header';

export default function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  return (
    <>
      <div className="mx-auto max-w-[1600px]">
        <ProjectWorkspaceHeader projectId={projectId} />
      </div>
      {children}
    </>
  );
}
