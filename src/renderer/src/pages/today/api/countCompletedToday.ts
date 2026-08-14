import type { TasksCountResult } from "@/main/tasks";

export const countCompletedToday = (): Promise<TasksCountResult> =>
  window.api.tasks.countCompletedToday();
