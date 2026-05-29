'use client';

import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { BoardTask, KanbanBoardResponse, MoveBoardTaskPayload, ReorderBoardTaskPayload } from '@plan-self/types';
import { KanbanColumnPanel } from './kanban-column-panel';
import { KanbanTaskCard } from './kanban-task-card';

export function KanbanBoard({
  projectId,
  board,
  tasksByColumn,
  moveTask,
  reorderTasks,
}: {
  projectId: string;
  board: KanbanBoardResponse;
  tasksByColumn: Map<string, BoardTask[]>;
  moveTask: (payload: MoveBoardTaskPayload) => Promise<unknown>;
  reorderTasks: (payload: ReorderBoardTaskPayload) => Promise<unknown>;
}) {
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const lastOverIdRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection: CollisionDetection = (args) => {
    const collisions = pointerWithin(args);
    return collisions.length > 0 ? collisions : closestCorners(args);
  };

  const allTasks = board.tasks;
  const taskMap = new Map(allTasks.map((task) => [task.id, task]));
  const columnIds = new Set(board.columns.map((col) => col.id));

  const getColumnForId = (id: string): string | null => {
    if (columnIds.has(id)) return id;
    const task = taskMap.get(id);
    return task?.boardColumnId ?? null;
  };

  const onDragStart = (event: DragStartEvent) => {
    const task = taskMap.get(String(event.active.id));
    setActiveTask(task ?? null);
    lastOverIdRef.current = null;
  };

  const onDragOver = (event: DragOverEvent) => {
    const nextOverId = event.over ? String(event.over.id) : null;
    setOverId(nextOverId);

    if (nextOverId) {
      lastOverIdRef.current = nextOverId;
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const overIdStr = event.over ? String(event.over.id) : lastOverIdRef.current;
    setActiveTask(null);
    setOverId(null);
    lastOverIdRef.current = null;

    const activeId = String(event.active.id);
    if (!overIdStr) return;

    const sourceColumnId = getColumnForId(activeId);
    const targetColumnId = getColumnForId(overIdStr);

    if (!sourceColumnId || !targetColumnId) return;

    if (sourceColumnId === targetColumnId) {
      const columnTasks = tasksByColumn.get(sourceColumnId) ?? [];
      const currentIds = columnTasks.map((t) => t.id);
      const oldIndex = currentIds.indexOf(activeId);
      const newIndex = columnIds.has(overIdStr)
        ? currentIds.length - 1
        : currentIds.indexOf(overIdStr);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const orderedTaskIds = arrayMove(currentIds, oldIndex, newIndex);
        await reorderTasks({ projectId, columnId: sourceColumnId, orderedTaskIds });
      }
    } else {
      const targetTasks = tasksByColumn.get(targetColumnId) ?? [];
      const targetPosition = columnIds.has(overIdStr)
        ? targetTasks.length
        : targetTasks.findIndex((t) => t.id === overIdStr);

      await moveTask({
        projectId,
        taskId: activeId,
        targetColumnId,
        targetPosition: targetPosition >= 0 ? targetPosition : targetTasks.length,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    onDragEnd(event).catch((error: unknown) => {
      toast.error('Erro ao mover task');
      console.error('Kanban drag failed', error);
    });
  };

  const totalTasks = board.tasks.length;

  return (
    <>
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex items-center">
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
            <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px]">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          autoScroll
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-6">
            {board.columns.map((column) => (
              <KanbanColumnPanel
                key={column.id}
                column={column}
                tasks={tasksByColumn.get(column.id) ?? []}
                isOver={overId !== null && getColumnForId(overId) === column.id}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-72 rounded-[20px] border border-[#b794ff]/70 bg-[#1c1630] px-4 py-3 shadow-2xl">
                <p className="text-xs text-white/45">{activeTask.code}</p>
                <p className="mt-1 text-sm font-semibold text-white">{activeTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
