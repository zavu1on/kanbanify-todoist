import type { TasksCountResult } from "@/main/tasks";

export const getTaskCount = (): Promise<TasksCountResult> =>
  window.api.tasks.count();
