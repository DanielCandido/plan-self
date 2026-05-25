'use client';

import React, {
  Suspense,
  memo,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SprintCard } from '@/components/dashboard/sprint-card';
import { ProductivityCard } from '@/components/dashboard/productivity-card';
import { SummaryBar } from '@/components/dashboard/summary-bar';
import { useDashboard } from '@/hooks/use-dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useDashboardStore } from '@/store/dashboard.store';

const ActivityFeed = dynamic(
  () => import('@/components/dashboard/activity-feed').then((module) => module.ActivityFeed),
  { ssr: false },
);

const MyTasksCard = dynamic(
  () => import('@/components/dashboard/my-tasks-card').then((module) => module.MyTasksCard),
  { ssr: false },
);

export default function DashboardPage() {
  useSession();

  const {
    user,
    logout,
    isLoading: isAuthLoading,
    isBootstrapped,
    isAuthenticated,
  } = useAuth();

  const sidebarOpen = useDashboardStore((state) => state.sidebarOpen);
  const setSidebarOpen = useDashboardStore((state) => state.setSidebarOpen);
  const searchTerm = useDashboardStore((state) => state.searchTerm);
  const setSearchTerm = useDashboardStore((state) => state.setSearchTerm);
  const commandOpen = useDashboardStore((state) => state.commandOpen);
  const setCommandOpen = useDashboardStore((state) => state.setCommandOpen);

  if (!isBootstrapped) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardErrorBoundary fallback={<DashboardErrorState />}>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          userName={user?.name}
          onLogout={logout}
          isLoggingOut={isAuthLoading}
          sidebarOpen={sidebarOpen}
          onSidebarChange={setSidebarOpen}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          commandOpen={commandOpen}
          onCommandChange={setCommandOpen}
        />
      </Suspense>
    </DashboardErrorBoundary>
  );
}

const DashboardContent = memo(function DashboardContent({
  userName,
  onLogout,
  isLoggingOut,
  sidebarOpen,
  onSidebarChange,
  searchTerm,
  onSearchChange,
  commandOpen,
  onCommandChange,
}: {
  userName?: string;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
  sidebarOpen: boolean;
  onSidebarChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  commandOpen: boolean;
  onCommandChange: (open: boolean) => void;
}) {
  const { data, rawData, isUpdatingTask, updateTaskStatus } = useDashboard();

  return (
    <DashboardShell
      sidebarOpen={sidebarOpen}
      onSidebarChange={onSidebarChange}
      header={
        <DashboardHeader
          userName={userName}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onOpenCommand={() => onCommandChange(true)}
          onToggleSidebar={() => onSidebarChange(!sidebarOpen)}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-5">
          <SprintCard sprint={data.sprint} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="xl:col-span-7"
        >
          <ProductivityCard productivity={data.productivity} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="xl:col-span-6"
        >
          <MyTasksCard
            tasks={data.myTasks}
            isUpdating={isUpdatingTask}
            onUpdateStatus={updateTaskStatus}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-6"
        >
          <ActivityFeed activities={data.recentActivities} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="xl:col-span-12"
        >
          <SummaryBar summary={data.summary} />
        </motion.div>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={onCommandChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        taskTitles={rawData.myTasks.map((task) => task.title)}
        activityTitles={rawData.recentActivities.map((activity) => activity.task ?? activity.type)}
      />
    </DashboardShell>
  );
});

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#12131a] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1500px] animate-pulse space-y-4">
        <div className="h-10 rounded-lg border border-white/10 bg-white/[0.04]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="h-48 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-5" />
          <div className="h-48 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-7" />
          <div className="h-72 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-6" />
          <div className="h-72 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-6" />
          <div className="h-24 rounded-lg border border-white/10 bg-white/[0.04] xl:col-span-12" />
        </div>
      </div>
    </main>
  );
}

function DashboardErrorState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#12131a] px-4">
      <div className="glass-card w-full max-w-md rounded-lg border border-white/10 p-5 text-center">
        <h2 className="text-base font-semibold text-white">Falha ao carregar dashboard</h2>
        <p className="mt-2 text-sm text-[#d2bbff]/70">
          Não foi possível obter os dados agora. Atualize a página para tentar novamente.
        </p>
      </div>
    </main>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  searchTerm,
  onSearchChange,
  taskTitles,
  activityTitles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  taskTitles: string[];
  activityTitles: string[];
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-20 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        aria-label="Fechar comando"
      />
      <div className="relative z-10 w-full max-w-xl rounded-lg border border-white/10 bg-[#161823]/95 p-3 shadow-glow">
        <div className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-2">
          <span className="text-xs text-[#d2bbff]/60">⌘K</span>
          <input
            autoFocus
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar..."
            className="h-10 w-full bg-transparent text-sm text-white placeholder:text-[#d2bbff]/35 outline-none"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70"
          >
            Esc
          </button>
        </div>

        <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
          <CommandSection title="Tasks" items={taskTitles} />
          <CommandSection title="Atividades" items={activityTitles} />
        </div>
      </div>
    </div>
  );
}

function CommandSection({ title, items }: { title: string; items: string[] }) {
  const visible = items.filter(Boolean).slice(0, 8);

  return (
    <section>
      <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-[#d2bbff]/45">{title}</p>
      {visible.length === 0 ? (
        <p className="rounded border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/45">
          Sem resultados.
        </p>
      ) : (
        <ul className="space-y-1">
          {visible.map((item) => (
            <li
              key={`${title}-${item}`}
              className="rounded border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white/80"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

class DashboardErrorBoundary extends React.Component<
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

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
