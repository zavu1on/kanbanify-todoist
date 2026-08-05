import type { TasksListResult } from "@/main/tasks";

export const listTasks = (cursor: string | null): Promise<TasksListResult> =>
  window.api.tasks.list(cursor);
