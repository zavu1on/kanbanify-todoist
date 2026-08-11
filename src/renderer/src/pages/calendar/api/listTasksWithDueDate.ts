import type { TasksListResult } from "@/main/tasks";

export const listTasksWithDueDate = (
  cursor: string | null,
): Promise<TasksListResult> => window.api.tasks.listWithDueDate(cursor);
