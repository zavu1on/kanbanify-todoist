import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { TasksCountResult } from "@/main/tasks";
import { snapshotAndUpdate } from "@/shared/api/optimisticCache";
import { taskCountQueryKey, todayCountQueryKey } from "../model/queryKeys";

const bump = (queryClient: QueryClient, queryKey: QueryKey, delta: number) =>
  snapshotAndUpdate<TasksCountResult>(queryClient, queryKey, (data) =>
    data?.ok ? { ...data, count: data.count + delta } : data,
  );

/**
 * Optimistically bumps the sidebar's "Tasks"/"Today" badge counts, returning
 * the pre-bump snapshots so the caller can roll both back on failure (same
 * shape as the `previous` list-cache snapshot every mutation already keeps).
 * `today` should reflect `isDueTodayOrOverdue` before vs. after the
 * mutation, not just whether a due date is set.
 */
export const applyTaskCountDelta = (
  queryClient: QueryClient,
  { total, today }: { total: number; today: number },
) => ({
  previousTaskCount: bump(queryClient, taskCountQueryKey, total),
  previousTodayCount: bump(queryClient, todayCountQueryKey, today),
});
