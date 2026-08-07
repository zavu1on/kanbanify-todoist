import type { CompleteTaskResult } from "@/main/tasks";

export const completeTask = (taskId: string): Promise<CompleteTaskResult> =>
  window.api.tasks.complete(taskId);
