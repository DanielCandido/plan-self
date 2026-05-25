'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { SprintBoard } from '@/components/sprints/sprint-board';
import { useSprintBoard } from '@/hooks/use-sprint-board';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { ClientErrorBoundary, SprintErrorState, SprintSkeleton } from '@plan-self/ui';

export default function ProjectSprintsPage() {
  useSession();
  const params = useParams<{ projectId: string }>();
  const { isBootstrapped, isAuthenticated } = useAuth();

  if (!isBootstrapped) {
    return <SprintSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ClientErrorBoundary
      fallback={<SprintErrorState />}
      onError={(error, errorInfo) => console.error('Sprint render error', error, errorInfo)}
    >
      <Suspense fallback={<SprintSkeleton />}>
        <SprintBoardContainer projectId={params.projectId} />
      </Suspense>
    </ClientErrorBoundary>
  );
}

function SprintBoardContainer({ projectId }: { projectId: string }) {
  const sprintBoard = useSprintBoard(projectId);
  return <SprintBoard projectId={projectId} {...sprintBoard} />;
}
