import { useInfiniteQuery } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/api/queryConfig";
import { filterTasksListQueryKey } from "../model/queryKeys";
import { listFilterTasks } from "./listFilterTasks";

/** Mirrors `pages/tasks/api/useTasksQuery.ts` — same cursor-based
 * `useInfiniteQuery` shape over the free-tier 200-item pagination, just
 * scoped to one saved filter's query instead of a project/the whole list. */
export const useFilterTasksQuery = (filterId: number) =>
  useInfiniteQuery({
    queryKey: filterTasksListQueryKey(filterId),
    queryFn: ({ pageParam }) => listFilterTasks(filterId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.ok ? lastPage.nextCursor : undefined,
    staleTime: STALE_TIME,
  });
