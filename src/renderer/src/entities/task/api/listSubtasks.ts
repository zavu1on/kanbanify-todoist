import type { TasksListResult } from "@/main/tasks";

export const listSubtasks = (
  cursor: string | null,
  parentId: string,
): Promise<TasksListResult> =>
  window.api.tasks.list(cursor, undefined, parentId);
