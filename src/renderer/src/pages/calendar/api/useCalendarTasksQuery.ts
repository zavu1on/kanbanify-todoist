import { useInfiniteQuery } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/api/queryConfig";
import { calendarTasksListQueryKey } from "../model/queryKeys";
import { listTasksWithDueDate } from "./listTasksWithDueDate";

/** Same "Load more" pagination as `pages/tasks` (SPECIFICATION.md's per-month
 * loading is intentionally not implemented — see the feature's hand-off
 * notes), scoped to dated tasks via `tasks:listWithDueDate`. */
export const useCalendarTasksQuery = () =>
  useInfiniteQuery({
    queryKey: calendarTasksListQueryKey,
    queryFn: ({ pageParam }) => listTasksWithDueDate(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.ok ? lastPage.nextCursor : undefined,
    staleTime: STALE_TIME,
  });
