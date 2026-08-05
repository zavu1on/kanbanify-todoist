import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { Group } from "@mantine/core";
import type { FC } from "react";
import { TaskCard } from "@/entities/task";
import { KANBAN_STATUS_LEVELS, type Task } from "@/main/tasks";
import { useDragOnDropHandlers } from "../lib/useDragOnDropHandlers";
import { KanbanColumn } from "./KanbanColumn";

type TaskBoardProps = {
  tasks: Task[];
};

export const TaskBoard: FC<TaskBoardProps> = ({ tasks }) => {
  const {
    columns,
    activeTask,
    dropTargetStatus,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragOnDropHandlers(tasks);

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
          />
        ))}
      </Group>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} hideKanbanStatus />}
      </DragOverlay>
    </DndContext>
  );
};
