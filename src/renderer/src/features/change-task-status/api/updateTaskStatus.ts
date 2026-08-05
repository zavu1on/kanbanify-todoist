import type { KanbanStatusLevel, UpdateTaskStatusResult } from "@/main/tasks";

export const updateTaskStatus = (
  taskId: string,
  status: KanbanStatusLevel,
): Promise<UpdateTaskStatusResult> =>
  window.api.tasks.updateStatus(taskId, status);
