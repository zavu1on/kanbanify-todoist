import type { UpdateTaskRequest, UpdateTaskResult } from "@/main/tasks";

export const updateTask = (
  taskId: string,
  input: UpdateTaskRequest,
): Promise<UpdateTaskResult> => window.api.tasks.update(taskId, input);
