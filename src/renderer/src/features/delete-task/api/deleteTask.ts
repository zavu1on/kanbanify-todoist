import type { DeleteTaskResult } from "@/main/tasks";

export const deleteTask = (taskId: string): Promise<DeleteTaskResult> =>
  window.api.tasks.delete(taskId);
