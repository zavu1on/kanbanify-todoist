import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Group } from "@mantine/core";
import type { FC } from "react";
import { useChangeTaskStatusMutation } from "@/features/change-task-status";
import {
  KANBAN_STATUS_LEVELS,
  type KanbanStatusLevel,
  type Task,
} from "@/main/tasks";
import { KanbanColumn } from "./KanbanColumn";

type TaskBoardProps = {
  tasks: Task[];
};

export const TaskBoard: FC<TaskBoardProps> = ({ tasks }) => {
  const changeStatusMutation = useChangeTaskStatusMutation();

  const columns = new Map<KanbanStatusLevel, Task[]>(
    KANBAN_STATUS_LEVELS.map((status) => [status, []]),
  );
  for (const task of tasks) {
    columns.get(task.kanbanStatus.level)?.push(task);
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const targetStatus = over.id as KanbanStatusLevel;
    const task = tasks.find((candidate) => candidate.id === active.id);
    if (!task || task.kanbanStatus.level === targetStatus) return;

    changeStatusMutation.mutate({ taskId: task.id, status: targetStatus });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
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
          />
        ))}
      </Group>
    </DndContext>
  );
};
