import type { TasksListResult } from "@/main/tasks";

export const listTodayTasks = (
  cursor: string | null,
): Promise<TasksListResult> => window.api.tasks.listToday(cursor);
