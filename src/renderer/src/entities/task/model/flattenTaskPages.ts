import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import type { TasksListResult } from "@/main/tasks";

/** Shared by every screen paginating `tasks:list`/`tasks:listWithDueDate`
 * (`pages/tasks`, `pages/calendar`) — flattens the accumulated pages into one
 * task list, surfacing only the *first* page's error: a failed "Load more"
 * still leaves the already-loaded pages on screen (see
 * `useLoadMoreTasksHandler`'s notification for that case), only a failed
 * first page blocks the whole view. */
export const flattenTaskPages = (
  tasksQuery: UseInfiniteQueryResult<InfiniteData<TasksListResult>>,
) => {
  const pages = tasksQuery.data?.pages ?? [];
  const tasks = pages.flatMap((page) => (page.ok ? page.tasks : []));
  const firstPage = pages[0];
  const initialLoadError = firstPage && !firstPage.ok ? firstPage.error : null;
  return { tasks, initialLoadError };
};
