'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { ClientErrorBoundary, KanbanErrorState, KanbanSkeleton } from '@plan-self/ui';

export default function ProjectKanbanPage() {
  useSession();
  const params = useParams<{ projectId: string }>();
  const { isBootstrapped, isAuthenticated } = useAuth();

  if (!isBootstrapped) {
    return <KanbanSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ClientErrorBoundary
      fallback={<KanbanErrorState />}
      onError={(error: Error, errorInfo: React.ErrorInfo) => console.error('Kanban render error', error, errorInfo)}
    >
      <Suspense fallback={<KanbanSkeleton />}>
        <KanbanBoardContainer projectId={params.projectId} />
      </Suspense>
    </ClientErrorBoundary>
  );
}

function KanbanBoardContainer({ projectId }: { projectId: string }) {
  const { board, tasksByColumn, isBoardLoading, moveTask, reorderTasks } = useKanbanBoard(projectId);

  if (isBoardLoading || !board) {
    return <KanbanSkeleton />;
  }

  return (
    <KanbanBoard
      projectId={projectId}
      board={board}
      tasksByColumn={tasksByColumn}
      moveTask={moveTask}
      reorderTasks={reorderTasks}
    />
  );
}
