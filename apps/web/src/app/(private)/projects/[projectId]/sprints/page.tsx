'use client';

import React, { Suspense, type ErrorInfo, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { SprintBoard } from '@/components/sprints/sprint-board';
import { useSprintBoard } from '@/hooks/use-sprint-board';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectSprintsPage() {
  useSession();
  const params = useParams<{ projectId: string }>();
  const { isBootstrapped, isAuthenticated } = useAuth();

  // Don't mount the board (which performs API calls) until session bootstrapping
  if (!isBootstrapped) {
    return <SprintSkeleton />;
  }

  // If user is not authenticated, render nothing (useSession will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SprintErrorBoundary fallback={<SprintErrorState />}>
      <Suspense fallback={<SprintSkeleton />}>
        <SprintBoardContainer projectId={params.projectId} />
      </Suspense>
    </SprintErrorBoundary>
  );
}

function SprintBoardContainer({ projectId }: { projectId: string }) {
  const sprintBoard = useSprintBoard(projectId);
  return <SprintBoard projectId={projectId} {...sprintBoard} />;
}

function SprintSkeleton() {
  return (
    <main className="min-h-screen bg-[#111218] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1600px] animate-pulse space-y-4">
        <div className="h-14 rounded-2xl border border-white/10 bg-white/[0.04]" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="h-[720px] rounded-[28px] border border-white/10 bg-white/[0.04]" />
          <div className="h-[720px] rounded-[28px] border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </main>
  );
}

function SprintErrorState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111218] px-4">
      <div className="glass-card w-full max-w-md rounded-3xl border border-white/10 p-6 text-center">
        <h1 className="text-lg font-semibold text-white">Falha ao carregar sprint</h1>
        <p className="mt-2 text-sm text-white/60">Atualize a página para tentar novamente.</p>
      </div>
    </main>
  );
}

class SprintErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sprint render error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
