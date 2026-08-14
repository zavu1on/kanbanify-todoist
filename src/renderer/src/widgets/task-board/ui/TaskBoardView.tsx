import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Group } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import { type FC, useCallback, useState } from "react";
import { TaskCard } from "@/entities/task";
import { useCompleteTaskMutation } from "@/features/complete-task";
import { type TaskFormDefaults, TaskFormModal } from "@/features/manage-task";
import {
  KANBAN_STATUS_LEVELS,
  type KanbanStatusLevel,
  type TaskDTO,
} from "@/main/tasks";
import { useDragOnDropHandlers } from "../models/useDragOnDropHandlers";
import { KanbanColumn } from "./KanbanColumn";

type TaskBoardProps = {
  tasks: TaskDTO[];
  // The cache entry these tasks came from — status changes and add/edit write
  // their optimistic updates there (see `useChangeTaskStatusMutation`,
  // `TaskFormModal`).
  queryKey: QueryKey;
  hideProject?: boolean;
  // Pre-fills a new task's project (see SPECIFICATION.md "Добавление задачи")
  // — absent on the global "Tasks" page, set on a project's page.
  projectId?: string;
  // Pre-fills a new task's due date — set on the Today page so its "+"
  // button creates a task due today (SPECIFICATION.md "Сегодня"), absent
  // elsewhere.
  createDueDefault?: TaskDTO["due"];
};

export const TaskBoardView: FC<TaskBoardProps> = ({
  tasks,
  queryKey,
  hideProject,
  projectId,
  createDueDefault,
}) => {
  const {
    columns,
    activeTask,
    dropTargetStatus,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragOnDropHandlers(tasks, queryKey);
  const completeTaskMutation = useCompleteTaskMutation(queryKey);
  // Stable across renders (`mutate` itself is stable per TanStack Query) so
  // `DraggableTaskCard`'s `memo` can actually skip untouched cards.
  const handleComplete = useCallback(
    (taskId: string) => completeTaskMutation.mutate({ taskId }),
    [completeTaskMutation.mutate],
  );
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [createDefaults, setCreateDefaults] = useState<TaskFormDefaults | null>(
    null,
  );

  const handleAddTask = (status: KanbanStatusLevel) => {
    setCreateDefaults({
      projectId,
      kanbanStatus: status,
      due: createDueDefault,
    });
  };

  // Without an activation distance, dnd-kit treats every pointerdown as a
  // drag start (even a plain click) and swallows the click event that would
  // otherwise follow — which is what opens the task modal.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Group
        align="stretch"
        gap="md"
        wrap="nowrap"
        style={{ overflowX: "auto" }}
      >
        {KANBAN_STATUS_LEVELS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columns.get(status) ?? []}
            isDropTarget={dropTargetStatus === status}
            hideProject={hideProject}
            onComplete={handleComplete}
            onTaskClick={setEditingTask}
            onAddTask={() => handleAddTask(status)}
          />
        ))}
      </Group>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            hideKanbanStatus
            hideProject={hideProject}
            // Prevent task completing when task is dragging
            onComplete={() => {}}
          />
        )}
      </DragOverlay>

      {/* Mounted only while open — a fresh instance each time means
          `useForm`'s initialValues (seeded from `task`/`defaults`) get
          recomputed per click instead of being stuck at whatever they were
          on the modal's first-ever mount (see `Sidebar`'s "New task" modal). */}
      {(editingTask || createDefaults !== null) && (
        <TaskFormModal
          opened
          onClose={() => {
            setEditingTask(null);
            setCreateDefaults(null);
          }}
          queryKey={queryKey}
          task={editingTask ?? undefined}
          defaults={createDefaults ?? { projectId }}
        />
      )}
    </DndContext>
  );
};
