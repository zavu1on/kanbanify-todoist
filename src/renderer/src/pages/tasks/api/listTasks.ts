import type { TasksListResult } from "@/main/tasks";

export const listTasks = (
  cursor: string | null,
  projectId?: string,
): Promise<TasksListResult> => window.api.tasks.list(cursor, projectId);
