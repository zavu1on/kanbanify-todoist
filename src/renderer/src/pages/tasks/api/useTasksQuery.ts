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
 *
 * Tasks arrive sorted by due date (`ListTasksUseCase`, backend). The Kanban
 * board doesn't fight that ordering — `buildColumns` preserves a column's
 * existing card order across re-renders (see SPECIFICATION.md "Kanban-режим":
 * drag inside a column sets *manual* order), so incoming sort order only
 * matters for genuinely new cards, not for cards already on the board.
 */
export const useTasksQuery = () =>
  useInfiniteQuery({
    queryKey: tasksListQueryKey,
    queryFn: ({ pageParam }) => listTasks(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.ok ? lastPage.nextCursor : undefined,
    // Status changes already write straight into this cache (see
    // useChangeTaskStatusMutation), so a background refetch on every remount
    // just burns an IPC round trip for data that's usually still current —
    // "Refetch" stays available for an explicit forced reload.
    staleTime: 60_000,
  });
