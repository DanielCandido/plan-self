'use client';

import { useEffect, useMemo } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import type { CreateSprintPayload, ProjectSprintBoardResponse, SprintTask, SprintSummary } from '@plan-self/types';
import { BacklogPanel } from './backlog-panel';
import { CompleteSprintModal } from './complete-sprint-modal';
import { CreateSprintModal } from './create-sprint-modal';
import { MoveTaskModal } from './move-task-modal';
import { SprintCard } from './sprint-card';
import { SprintHeader } from './sprint-header';
import { SprintHistoryModal } from './sprint-history-modal';
import { SprintMetrics } from './sprint-metrics';
import { useBacklogStore } from '@/store/backlog.store';
import { useDragStore } from '@/store/drag.store';
import { useSprintStore } from '@/store/sprint.store';

export function SprintBoard({
  projectId,
  board,
  groupedBacklog,
  backlogItems,
  createSprint,
  isCreatingSprint,
  completeSprint,
  isCompletingSprint,
  moveTasks,
  isMovingTasks,
  reorderTasks,
  updateTask,
  isUpdatingTask,
  createQuickTask,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: {
  projectId: string;
  board?: ProjectSprintBoardResponse;
  groupedBacklog: Array<{ id: string; name: string; color: string | null; taskCount: number; totalStoryPoints: number; tasks: SprintTask[] }>;
  backlogItems: SprintTask[];
  createSprint: (payload: CreateSprintPayload) => Promise<unknown>;
  isCreatingSprint: boolean;
  completeSprint: (payload: { sprintId: string; payload?: { notes?: string } }) => Promise<unknown>;
  isCompletingSprint: boolean;
  moveTasks: (payload: { taskId: string; payload: { projectId: string; taskIds: string[]; targetSprintId?: string | null } }) => Promise<unknown>;
  isMovingTasks: boolean;
  reorderTasks: (payload: { taskId: string; payload: { projectId: string; orderedTaskIds: string[]; sprintId?: string | null } }) => Promise<unknown>;
  updateTask: (payload: { taskId: string; payload: { title?: string; priority?: string; storyPoints?: number } }) => Promise<unknown>;
  isUpdatingTask: boolean;
  createQuickTask: (payload: { title: string }) => Promise<unknown>;
  hasNextPage?: boolean;
  fetchNextPage: () => Promise<unknown>;
  isFetchingNextPage?: boolean;
}) {
  const SPRINT_CONTAINER_ID = 'sprint-container';
  const BACKLOG_CONTAINER_ID = 'backlog-container';
  const SPRINT_DROPZONE_ID = 'sprint-dropzone';

  const activeModal = useSprintStore((state) => state.activeModal);
  const setActiveModal = useSprintStore((state) => state.setActiveModal);
  const commandOpen = useSprintStore((state) => state.commandOpen);
  const setCommandOpen = useSprintStore((state) => state.setCommandOpen);
  const mobileTab = useSprintStore((state) => state.mobileTab);
  const setMobileTab = useSprintStore((state) => state.setMobileTab);
  const focusedTaskId = useSprintStore((state) => state.focusedTaskId);
  const setFocusedTaskId = useSprintStore((state) => state.setFocusedTaskId);

  const search = useBacklogStore((state) => state.search);
  const setSearch = useBacklogStore((state) => state.setSearch);
  const selectedTaskIds = useBacklogStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useBacklogStore((state) => state.toggleTaskSelection);
  const clearSelection = useBacklogStore((state) => state.clearSelection);
  const collapsedEpics = useBacklogStore((state) => state.collapsedEpics);
  const toggleEpic = useBacklogStore((state) => state.toggleEpic);
  const setPriority = useBacklogStore((state) => state.setPriority);
  const setSortBy = useBacklogStore((state) => state.setSortBy);

  const activeTaskId = useDragStore((state) => state.activeTaskId);
  const setActiveTaskId = useDragStore((state) => state.setActiveTaskId);
  const draggingTaskIds = useDragStore((state) => state.draggingTaskIds);
  const setDraggingTaskIds = useDragStore((state) => state.setDraggingTaskIds);

  const activeSprint = board?.activeSprint ?? board?.sprints?.[0] ?? null;
  const sprintTasks = activeSprint?.tasks ?? [];
  const taskMap = useMemo(() => new Map([...sprintTasks, ...backlogItems].map((task) => [task.id, task])), [backlogItems, sprintTasks]);
  const focusedTask = focusedTaskId ? taskMap.get(focusedTaskId) ?? null : null;
  const dragPreviewTask = activeTaskId ? taskMap.get(activeTaskId) ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommandOpen]);

  const getContainer = (id: string) => {
    if (id === BACKLOG_CONTAINER_ID || backlogItems.some((task) => task.id === id)) return 'backlog';
    if (
      id === SPRINT_CONTAINER_ID ||
      id === SPRINT_DROPZONE_ID ||
      sprintTasks.some((task) => task.id === id)
    ) {
      return 'sprint';
    }
    return null;
  };

  const onDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id);
    setActiveTaskId(taskId);
    setDraggingTaskIds(selectedTaskIds.includes(taskId) ? selectedTaskIds : [taskId]);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveTaskId(null);
    if (!overId) {
      setDraggingTaskIds([]);
      return;
    }

    const activeContainer = getContainer(activeId);
    const overContainer = getContainer(overId);
    if (!activeContainer || !overContainer) {
      setDraggingTaskIds([]);
      return;
    }

    const movingIds = draggingTaskIds.length > 0 ? draggingTaskIds : [activeId];

    if (overContainer === 'sprint' && !activeSprint?.id) {
      toast.info('Please create a sprint first to move tasks from the backlog.');
      setDraggingTaskIds([]);
      return;
    }

    if (activeContainer === overContainer) {
      const source = activeContainer === 'sprint' ? sprintTasks : backlogItems;
      const currentIds = source.map((task) => task.id);
      const oldIndex = currentIds.indexOf(activeId);
      let newIndex = currentIds.indexOf(overId);
      const droppedOnContainer =
        overId === SPRINT_CONTAINER_ID || overId === BACKLOG_CONTAINER_ID || overId === SPRINT_DROPZONE_ID;
      if (newIndex === -1 && droppedOnContainer) {
        newIndex = currentIds.length;
      }
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const orderedTaskIds = arrayMove(currentIds, oldIndex, newIndex);
        await reorderTasks({
          taskId: activeId,
          payload: {
            projectId,
            orderedTaskIds,
            sprintId: activeContainer === 'sprint' ? activeSprint?.id ?? undefined : undefined,
          },
        });
      }
    } else {
      await moveTasks({
        taskId: movingIds[0],
        payload: {
          projectId,
          taskIds: movingIds,
          targetSprintId: overContainer === 'sprint' ? activeSprint?.id ?? null : null,
        },
      });
      clearSelection();
    }

    setDraggingTaskIds([]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    onDragEnd(event).catch((error) => {
      console.error('Sprint drag and drop failed', error);
    });
  };

  return (
    <>
      <div className="mx-auto max-w-[1600px]">
        <SprintHeader
          projectName={board?.projectName ?? 'Sprint board'}
          backlogCount={board?.backlogCount ?? backlogItems.length}
          search={search}
          onSearchChange={setSearch}
          onOpenCreateSprint={() => setActiveModal('create')}
          onOpenHistory={() => setActiveModal('history')}
          onOpenCommand={() => setCommandOpen(true)}
        />
      </div>
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex gap-2 xl:hidden">
          <MobileTab active={mobileTab === 'sprint'} onClick={() => setMobileTab('sprint')}>Sprint</MobileTab>
          <MobileTab active={mobileTab === 'backlog'} onClick={() => setMobileTab('backlog')}>Backlog</MobileTab>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} autoScroll onDragStart={onDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
            <div className={`${mobileTab === 'backlog' ? 'hidden xl:block' : 'block'} space-y-4`}>
              <SortableContext items={sprintTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                <div id={SPRINT_CONTAINER_ID}>
                  <SprintCard
                    sprint={activeSprint}
                    selectedTaskIds={selectedTaskIds}
                    onSelectTask={toggleTaskSelection}
                    onQuickEditTask={(taskId) => {
                      setFocusedTaskId(taskId);
                      setActiveModal('move');
                    }}
                    isDropActive={draggingTaskIds.length > 0}
                    dropzoneId={SPRINT_DROPZONE_ID}
                  />
                </div>
              </SortableContext>
              <SprintMetrics
                sprint={activeSprint}
                metrics={board?.metrics ?? []}
                burndown={board?.burndown ?? []}
                velocityTrend={board?.velocityTrend ?? []}
              />
            </div>

            <div className={`${mobileTab === 'sprint' ? 'hidden xl:block' : 'block'}`}>
              <SortableContext items={backlogItems.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                <div id={BACKLOG_CONTAINER_ID}>
                  <BacklogPanel
                    groups={groupedBacklog}
                    selectedTaskIds={selectedTaskIds}
                    collapsedEpics={collapsedEpics}
                    onToggleEpic={toggleEpic}
                    onSelectTask={toggleTaskSelection}
                    onQuickEditTask={(taskId) => {
                      setFocusedTaskId(taskId);
                      setActiveModal('move');
                    }}
                    onSearchChange={setSearch}
                    search={search}
                    onCreateQuickTask={async (title) => {
                      await createQuickTask({ title });
                    }}
                    onPriorityChange={setPriority}
                    onSortChange={setSortBy}
                    onLoadMore={() => {
                      void fetchNextPage();
                    }}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                  />
                </div>
              </SortableContext>
            </div>
          </div>

          <DragOverlay>
            {dragPreviewTask ? (
              <div className="rounded-3xl border border-[#b794ff]/70 bg-[#1c1630] px-4 py-3 shadow-2xl">
                <p className="text-sm text-white/45">{dragPreviewTask.code}</p>
                <p className="mt-1 text-lg font-semibold text-white">{dragPreviewTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateSprintModal
        open={activeModal === 'create'}
        onOpenChange={(open) => setActiveModal(open ? 'create' : null)}
        onSubmit={async (payload) => {
          await createSprint(payload);
        }}
        isSubmitting={isCreatingSprint}
        projectId={projectId}
        teamMembers={board?.teamMembers ?? activeSprint?.members.map((member) => ({ userId: member.userId, name: member.name, avatarUrl: member.avatarUrl })) ?? []}
        recentSprint={board?.sprints?.[0] ?? null}
      />
      <CompleteSprintModal
        open={activeModal === 'complete'}
        sprint={activeSprint}
        onOpenChange={(open) => setActiveModal(open ? 'complete' : null)}
        onComplete={async (sprintId, notes) => {
          await completeSprint({ sprintId, payload: { notes } });
        }}
        isCompleting={isCompletingSprint}
      />
      <MoveTaskModal
        open={activeModal === 'move'}
        task={focusedTask}
        sprintOptions={board?.sprints ?? []}
        onOpenChange={(open) => {
          setActiveModal(open ? 'move' : null);
          if (!open) setFocusedTaskId(null);
        }}
        onMove={async (taskId, sprintId) => {
          await moveTasks({ taskId, payload: { projectId, taskIds: [taskId], targetSprintId: sprintId } });
        }}
        onUpdate={async (taskId, payload) => {
          await updateTask({ taskId, payload });
        }}
        isSaving={isMovingTasks || isUpdatingTask}
      />
      <SprintHistoryModal open={activeModal === 'history'} onOpenChange={(open) => setActiveModal(open ? 'history' : null)} entries={board?.history ?? []} />

      {commandOpen ? <CommandPalette onClose={() => setCommandOpen(false)} onOpenCreateSprint={() => setActiveModal('create')} onOpenHistory={() => setActiveModal('history')} onOpenComplete={() => setActiveModal('complete')} /> : null}

      <button
        type="button"
        onClick={() => setActiveModal('create')}
        className="fixed bottom-5 right-5 z-20 flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] text-3xl font-semibold text-[#140d22] shadow-[0_20px_40px_rgba(139,92,246,0.45)] xl:hidden"
      >
        +
      </button>
    </>
  );
}

function MobileTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-3 text-sm font-medium ${active ? 'bg-[#8b5cf6] text-white' : 'border border-white/10 bg-white/[0.04] text-white/60'}`}>
      {children}
    </button>
  );
}

function CommandPalette({ onClose, onOpenCreateSprint, onOpenHistory, onOpenComplete }: { onClose: () => void; onOpenCreateSprint: () => void; onOpenHistory: () => void; onOpenComplete: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 px-4 pt-20 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/10 bg-[#101118] p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/45">Quick actions</div>
        <div className="mt-4 space-y-2">
          {[{ label: 'Create sprint', onClick: onOpenCreateSprint }, { label: 'Complete sprint', onClick: onOpenComplete }, { label: 'Open history', onClick: onOpenHistory }].map((action) => (
            <button key={action.label} type="button" onClick={() => { action.onClick(); onClose(); }} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left text-sm text-white/75 hover:bg-white/[0.08]">
              <span>{action.label}</span>
              <span className="text-white/35">↵</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
