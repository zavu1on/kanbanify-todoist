import { useInfiniteQuery } from "@tanstack/react-query";
import { subtasksListQueryKey } from "../model/queryKeys";
import { listSubtasks } from "./listSubtasks";

/**
 * A task's direct subtasks, fetched only while its detail modal is open
 * (see `SubtasksSection`). Todoist's `getTasks` never returns completed
 * tasks, so this already is "all unfinished subtasks" with no extra filter.
 *
 * `useInfiniteQuery` (not a plain `useQuery`) so the cache shares the exact
 * `TasksListResult`/`InfiniteData` shape the rest of the task mutations
 * already know how to write into (`useCreateTaskMutation`, `useUpdateTaskMutation`,
 * `useCompleteTaskMutation`, `useDeleteTaskMutation`) — passing
 * `subtasksListQueryKey(parentId)` as their `queryKey` just works.
 *
 * ponytail: only the first page (200 subtasks) loads — no "Load more" control
 * in the modal. Free-tier subtask counts never come close; add pagination UI
 * here if that stops being true.
 */
export const useSubtasksQuery = (parentId: string) =>
  useInfiniteQuery({
    queryKey: subtasksListQueryKey(parentId),
    queryFn: ({ pageParam }) => listSubtasks(pageParam, parentId),
    initialPageParam: null as string | null,
    getNextPageParam: () => undefined,
    staleTime: 60_000,
  });
