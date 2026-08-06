import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { Group } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import { KANBAN_STATUS_LEVELS, type Task } from "@/main/tasks";
import { useDragOnDropHandlers } from "../lib/useDragOnDropHandlers";
import { KanbanColumn } from "./KanbanColumn";

type TaskBoardProps = {
  tasks: Task[];
  // The cache entry these tasks came from — status changes write their
  // optimistic update there (see `useChangeTaskStatusMutation`).
  queryKey: QueryKey;
  hideProject?: boolean;
};

export const TaskBoard: FC<TaskBoardProps> = ({
  tasks,
  queryKey,
  hideProject,
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

  return (
    <DndContext
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
          />
        ))}
      </Group>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            hideKanbanStatus
            hideProject={hideProject}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
