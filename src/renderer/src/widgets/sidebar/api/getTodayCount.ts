import type { TasksCountResult } from "@/main/tasks";

export const getTodayCount = (): Promise<TasksCountResult> =>
  window.api.tasks.countToday();
