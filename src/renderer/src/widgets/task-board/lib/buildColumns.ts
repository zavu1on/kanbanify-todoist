import {
  KANBAN_STATUS_LEVELS,
  type KanbanStatusLevel,
  type Task,
} from "@/main/tasks";

export type ColumnsByStatus = Map<KanbanStatusLevel, Task[]>;

export const buildColumns = (tasks: Task[]): ColumnsByStatus => {
  const columns = new Map<KanbanStatusLevel, Task[]>(
    KANBAN_STATUS_LEVELS.map((status) => [status, []]),
  );
  for (const task of tasks) {
    columns.get(task.kanbanStatus.level)?.push(task);
  }
  return columns;
};
