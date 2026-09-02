import type { FilterTasksResult } from "@/main/filters";

export const listFilterTasks = (
  filterId: number,
  cursor: string | null,
): Promise<FilterTasksResult> => window.api.filters.tasks(filterId, cursor);
