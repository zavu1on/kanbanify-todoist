import { notifications } from "@mantine/notifications";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { useCallback } from "react";
import type { TasksListResult } from "@/main/tasks";

/** Shared "Load more" handler for every screen paginating `tasks:list`/
 * `tasks:listWithDueDate` (`pages/tasks`, `pages/calendar`) — fetches the next
 * page and reports the running total or the page's error via a toast. */
export const useLoadMoreTasksHandler = (
  tasksQuery: UseInfiniteQueryResult<InfiniteData<TasksListResult>>,
) => {
  const { fetchNextPage } = tasksQuery;

  // `fetchNextPage` itself is stable across renders (TanStack Query
  // guarantee, same as `mutate`), and the result of the call — not
  // `tasksQuery.data` — is what the body reads below, so this is safe to
  // keep referentially stable regardless of how often `tasksQuery` itself
  // changes identity. Lets callers (e.g. `TasksPageToolbar`) be `memo`-ed
  // without this handler forcing a re-render on every task list update.
  return useCallback(async () => {
    const result = await fetchNextPage();
    const pages = result.data?.pages ?? [];
    const lastPage = pages.at(-1);
    if (!lastPage) return;

    if (lastPage.ok) {
      const totalLoaded = pages.reduce(
        (sum, page) => sum + (page.ok ? page.tasks.length : 0),
        0,
      );
      notifications.show({
        color: "green",
        title: "Tasks loaded",
        message: `Loaded ${totalLoaded} tasks in total`,
      });
    } else {
      notifications.show({
        color: "red",
        title: "Couldn't load more tasks",
        message: lastPage.error.message,
      });
    }
  }, [fetchNextPage]);
};
