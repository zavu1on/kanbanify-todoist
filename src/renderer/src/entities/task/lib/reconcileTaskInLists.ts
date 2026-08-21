import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import type { TaskDTO, TasksListResult } from "@/main/tasks";
import { tasksListQueryKey } from "../model/queryKeys";
import { belongsToList } from "./taskListMembership";

type TasksPages = InfiniteData<TasksListResult>;

export type TaskListSnapshot = {
  queryKey: QueryKey;
  previous: TasksPages | undefined;
};

/**
 * Optimistically reconciles `task` into every already-cached tasks-list
 * query (`["tasks","list",...]` — Today, Calendar, a project page, a
 * subtasks list, the unscoped "Tasks" page), not just the one `queryKey` the
 * caller's own screen happens to be showing. Per `belongsToList`: inserts
 * `task` into a list it's missing from but now qualifies for, patches it in
 * place where it's already present and still qualifies, or drops it where
 * it's present but no longer qualifies.
 *
 * This is what makes a create/edit made from one screen (e.g. the sidebar's
 * "New task" while on Today) show up correctly on every other *cached*
 * screen (a project page visited earlier this session) without waiting for
 * that screen's own next mount/refetch — a query that was never fetched at
 * all is left untouched (`if (!data) return data`), same as before.
 *
 * `removeId` is the task's id *before* this change (an update can't change
 * a task's id, so this only matters for readability) — kept separate from
 * `task.id` in case that ever changes.
 *
 * Returns a snapshot of every touched query's prior data, for the caller to
 * roll back on failure.
 */
export const reconcileTaskInLists = async (
  queryClient: QueryClient,
  task: TaskDTO,
  removeId: string = task.id,
): Promise<TaskListSnapshot[]> => {
  const queries = queryClient
    .getQueryCache()
    .findAll({ queryKey: tasksListQueryKey });

  const snapshots: TaskListSnapshot[] = [];
  for (const query of queries) {
    const queryKey = query.queryKey;
    await queryClient.cancelQueries({ queryKey, exact: true });
    const previous = queryClient.getQueryData<TasksPages>(queryKey);

    queryClient.setQueryData<TasksPages>(queryKey, (data) => {
      if (!data) return data;

      let found = false;
      const pages = data.pages.map((page) => {
        if (!page.ok) return page;
        return {
          ...page,
          tasks: page.tasks.flatMap((t) => {
            if (t.id !== removeId) return [t];
            found = true;
            return belongsToList(queryKey, task) ? [task] : [];
          }),
        };
      });

      if (found || !belongsToList(queryKey, task)) {
        return { ...data, pages };
      }
      // Missing from this list before, but qualifies now — insert it.
      const [firstPage, ...rest] = pages;
      if (!firstPage.ok) return { ...data, pages };
      return {
        ...data,
        pages: [{ ...firstPage, tasks: [task, ...firstPage.tasks] }, ...rest],
      };
    });

    snapshots.push({ queryKey, previous });
  }
  return snapshots;
};

/** Undoes `reconcileTaskInLists`, restoring every touched list to its
 * pre-mutation snapshot — used from `onError`/a failed `onSuccess`. */
export const restoreTaskListSnapshots = (
  queryClient: QueryClient,
  snapshots: TaskListSnapshot[],
) => {
  for (const { queryKey, previous } of snapshots) {
    queryClient.setQueryData(queryKey, previous);
  }
};
