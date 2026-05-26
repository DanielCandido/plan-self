'use client';

import { useMemo, useState } from 'react';
import type { SprintTask } from '@plan-self/types';
import { BacklogTaskCard } from './backlog-task-card';

interface BacklogGroup {
  id: string;
  name: string;
  color: string | null;
  taskCount: number;
  totalStoryPoints: number;
  tasks: SprintTask[];
}

export function BacklogPanel({
  groups,
  selectedTaskIds,
  collapsedEpics,
  onToggleEpic,
  onSelectTask,
  onQuickEditTask,
  onSearchChange,
  search,
  onCreateQuickTask,
  onPriorityChange,
  onSortChange,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: {
  groups: BacklogGroup[];
  selectedTaskIds: string[];
  collapsedEpics: Record<string, boolean>;
  onToggleEpic: (epicId: string) => void;
  onSelectTask: (taskId: string, multi?: boolean) => void;
  onQuickEditTask: (taskId: string) => void;
  onSearchChange: (value: string) => void;
  search: string;
  onCreateQuickTask: (title: string) => Promise<void>;
  onPriorityChange: (priority: string | null) => void;
  onSortChange: (sortBy: 'sortOrder' | 'priority' | 'storyPoints' | 'updatedAt' | 'title') => void;
  onLoadMore: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}) {
  const [quickTitle, setQuickTitle] = useState('');
  const total = useMemo(() => groups.reduce((sum, group) => sum + group.taskCount, 0), [groups]);

  return (
    <aside className="rounded-[32px] border border-white/10 bg-[#101118] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Backlog</h2>
          <p className="mt-2 text-sm text-white/55">{total} tasks prontas para planejamento.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70">{total} items</div>
      </div>

      <div className="mt-5 space-y-3">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search backlog..."
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/35 outline-none"
        />
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterButton onClick={() => onPriorityChange('HIGH')}>Priority</FilterButton>
          <FilterButton onClick={() => onSortChange('updatedAt')}>Recent</FilterButton>
          <FilterButton onClick={() => onSortChange('storyPoints')}>Story points</FilterButton>
          <FilterButton onClick={() => onPriorityChange(null)}>Clear</FilterButton>
        </div>
      </div>

      <div className="mt-5 space-y-4 overflow-y-auto pr-1 xl:max-h-[760px]">
        {groups.map((group) => {
          const collapsed = collapsedEpics[group.id];
          return (
            <section key={group.id} className="rounded-[28px] border border-white/8 bg-[#13141b] p-4">
              <button
                type="button"
                onClick={() => onToggleEpic(group.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{group.name}</p>
                  <p className="text-xs text-white/45">{group.taskCount} tasks • {group.totalStoryPoints} pts</p>
                </div>
                <span className="text-white/45">{collapsed ? '+' : '−'}</span>
              </button>
              {!collapsed ? (
                <div className="mt-4 space-y-3">
                  {group.tasks.map((task) => (
                    <BacklogTaskCard
                      key={task.id}
                      task={task}
                      selected={selectedTaskIds.includes(task.id)}
                      onSelect={onSelectTask}
                      onQuickEdit={onQuickEditTask}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
        {hasNextPage ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 hover:bg-white/[0.08]"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-[24px] border border-white/10 bg-white/[0.03] p-3">
        <input
          value={quickTitle}
          onChange={(event) => setQuickTitle(event.target.value)}
          placeholder="Add task to backlog"
          className="h-12 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/35 outline-none"
        />
        <button
          type="button"
          onClick={async () => {
            if (!quickTitle.trim()) return;
            await onCreateQuickTask(quickTitle.trim());
            setQuickTitle('');
          }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] text-xl font-semibold text-[#140d22]"
        >
          +
        </button>
      </div>
    </aside>
  );
}

function FilterButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/65 hover:bg-white/[0.08]"
    >
      {children}
    </button>
  );
}
