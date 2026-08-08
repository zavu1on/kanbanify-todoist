import type { CreateTaskRequest, CreateTaskResult } from "@/main/tasks";

export const createTask = (
  input: CreateTaskRequest,
): Promise<CreateTaskResult> => window.api.tasks.create(input);
