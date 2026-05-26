'use client';

import React, { Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SprintCard } from '@/components/dashboard/sprint-card';
import { ProductivityCard } from '@/components/dashboard/productivity-card';
import { SummaryBar } from '@/components/dashboard/summary-bar';
import { useDashboard } from '@/hooks/use-dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useDashboardStore } from '@/store/dashboard.store';
import {
  ClientErrorBoundary,
  DashboardCommandPalette,
  DashboardErrorState,
  DashboardSkeleton,
} from '@plan-self/ui';

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
    <ClientErrorBoundary
      fallback={<DashboardErrorState />}
      onError={(error, errorInfo) => console.error('Dashboard rendering error:', error, errorInfo)}
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          userName={user?.name}
          onLogout={logout}
          isLoggingOut={isAuthLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          commandOpen={commandOpen}
          onCommandChange={setCommandOpen}
        />
      </Suspense>
    </ClientErrorBoundary>
  );
}

const DashboardContent = memo(function DashboardContent({
  userName,
  onLogout,
  isLoggingOut,
  searchTerm,
  onSearchChange,
  commandOpen,
  onCommandChange,
}: {
  userName?: string;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  commandOpen: boolean;
  onCommandChange: (open: boolean) => void;
}) {
  const { data, rawData, isUpdatingTask, updateTaskStatus } = useDashboard();

  return (
    <>
      <DashboardHeader
        userName={userName}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onOpenCommand={() => onCommandChange(true)}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />
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

      <DashboardCommandPalette
        open={commandOpen}
        onOpenChange={onCommandChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        taskTitles={rawData.myTasks.map((task) => task.title)}
        activityTitles={rawData.recentActivities.map((activity) => activity.task ?? activity.type)}
      />
    </>
  );
});
