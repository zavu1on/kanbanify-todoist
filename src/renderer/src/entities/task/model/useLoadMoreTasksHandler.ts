import { notifications } from "@mantine/notifications";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import type { TasksListResult } from "@/main/tasks";

/** Shared "Load more" handler for every screen paginating `tasks:list`/
 * `tasks:listWithDueDate` (`pages/tasks`, `pages/calendar`) — fetches the next
 * page and reports the running total or the page's error via a toast. */
export const useLoadMoreTasksHandler = (
  tasksQuery: UseInfiniteQueryResult<InfiniteData<TasksListResult>>,
) => {
  return async () => {
    const result = await tasksQuery.fetchNextPage();
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
  };
};
