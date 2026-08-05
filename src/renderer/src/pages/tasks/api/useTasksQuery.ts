import { useInfiniteQuery } from "@tanstack/react-query";
import { tasksListQueryKey } from "@/entities/task";
import { listTasks } from "./listTasks";

/**
 * Lazy loading: this fires only once the Tasks screen has mounted (the UI
 * renders first, then this query kicks off the IPC call) — Skeleton is shown
 * for `isPending`. Pages accumulate via `fetchNextPage` for the "Load more"
 * button; a full page reload ("Refetch") goes through `queryClient.resetQueries`
 * on this key instead of `refetch()`, since `refetch()` on an infinite query
 * re-fetches every already-loaded page, not just the first one.
 */
export const useTasksQuery = () =>
  useInfiniteQuery({
    queryKey: tasksListQueryKey,
    queryFn: ({ pageParam }) => listTasks(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.ok ? lastPage.nextCursor : undefined,
  });
