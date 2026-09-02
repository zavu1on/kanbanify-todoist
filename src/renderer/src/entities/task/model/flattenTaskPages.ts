import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import type { TaskDTO } from "@/main/tasks";

/** The minimal page shape this module's helpers need — satisfied by
 * `TasksListResult` (`pages/tasks`, `pages/calendar`) and `FilterTasksResult`
 * (`pages/filter`) alike, so both can share `flattenTaskPages`/
 * `useLoadMoreTasksHandler` instead of each growing its own copy. Only the
 * `error` shape differs between those two contracts (different modules'
 * error-type unions), and neither helper reads more of it than `type`/
 * `message`. */
export type TaskPageResult =
  | { ok: true; tasks: TaskDTO[]; nextCursor: string | null }
  | { ok: false; error: { type: string; message: string } };

/** Shared by every screen paginating a tasks list (`pages/tasks`,
 * `pages/calendar`, `pages/filter`) — flattens the accumulated pages into one
 * task list, surfacing only the *first* page's error: a failed "Load more"
 * still leaves the already-loaded pages on screen (see
 * `useLoadMoreTasksHandler`'s notification for that case), only a failed
 * first page blocks the whole view. */
export const flattenTaskPages = <TResult extends TaskPageResult>(
  tasksQuery: UseInfiniteQueryResult<InfiniteData<TResult>>,
) => {
  const pages = tasksQuery.data?.pages ?? [];
  const tasks = pages.flatMap((page) => (page.ok ? page.tasks : []));
  const firstPage = pages[0];
  const initialLoadError = firstPage && !firstPage.ok ? firstPage.error : null;
  return { tasks, initialLoadError };
};
